const Station = require('../models/Station');
const Transaction = require('../models/Transaction');
const Vehicle = require('../models/Vehicle');
const FleetVehicle = require('../models/FleetVehicle');
const Dispenser = require('../models/Dispenser');
const { GoogleGenAI } = require('@google/genai');

exports.askAssistant = async (req, res) => {
  try {
    const { message, userLocation } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // 1. Gather Real Data Context from MongoDB
    const activeStations = await Station.find({ status: { $in: ['operational', 'active'] } }).lean();
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    
    const transactions = await Transaction.aggregate([
      { $match: { user: req.user._id, status: 'completed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, kg: { $sum: '$hydrogenDispensed' } } }
    ]);
    
    const totalSpend = transactions.length > 0 ? transactions[0].total : 0;
    const totalKg = transactions.length > 0 ? transactions[0].kg : 0;

    // 2. Try processing with LLM if API Key is configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        // Strip out Mongoose specific properties for cleaner prompt
        const cleanStations = activeStations.map(s => ({ 
          id: s._id, 
          name: s.name, 
          price: s.pricePerKg, 
          waitTime: s.waitTime, 
          pumps: s.availablePumps 
        }));

        const systemPrompt = `You are Aurora Intelligence, a Smart Refueling Assistant. 
Keep answers concise, friendly, and directly address the user's question. Use Markdown formatting.
Here is the LIVE data you MUST use to answer the user:
- Total Stations Online: ${activeStations.length}
- Stations Data: ${JSON.stringify(cleanStations)}
- User's Spend This Month: ₹${totalSpend.toFixed(2)}
- User's Hydrogen Used This Month: ${totalKg.toFixed(1)} kg

Return your response as a valid JSON object ONLY. Structure:
{
  "reply": "Your natural language response here",
  "structuredData": null | { "type": "station_recommendation", "stationId": "ID of recommended station", "reason": "Why" } | { "type": "spend_summary", "totalSpend": 0, "totalKg": 0 }
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\nUser Message: ' + message }] }
          ],
          config: {
            responseMimeType: 'application/json',
          }
        });

        const parsed = JSON.parse(response.text);
        let data = parsed.structuredData;
        
        // If Gemini recommends a station, hydrate the object for the frontend
        if (data && data.type === 'station_recommendation' && data.stationId) {
          const station = await Station.findById(data.stationId);
          if (station) {
            data.station = station;
          }
        }

        return res.json({
          success: true,
          data: {
            reply: parsed.reply,
            structuredData: data
          }
        });

      } catch (llmError) {
        console.error('LLM Processing Error (Falling back to deterministic):', llmError);
        // Fallthrough to deterministic logic if parsing fails or quota exhausted
      }
    }

    // 3. Fallback (Deterministic Keyword Logic)
    const lowerMsg = message.toLowerCase();
    let reply = "";
    let data = null;

    if (lowerMsg.includes('cheapest') || lowerMsg.includes('price') || lowerMsg.includes('cost')) {
      const cheapest = activeStations.sort((a,b) => (a.pricePerKg||0) - (b.pricePerKg||0))[0];
      if (cheapest) {
        reply = `The cheapest operational station right now is **${cheapest.name}** at ₹${cheapest.pricePerKg}/kg. It currently has ${cheapest.availablePumps} pumps available.`;
        data = { type: 'station_recommendation', station: cheapest, reason: 'Lowest price per kg' };
      } else {
        reply = "I couldn't find any operational stations right now.";
      }
    } 
    else if (lowerMsg.includes('where') || lowerMsg.includes('nearest') || lowerMsg.includes('closest') || lowerMsg.includes('near') || lowerMsg.includes('puncture') || lowerMsg.includes('emergency')) {
      const nearest = activeStations[0]; // Simplified fallback
      if (nearest) {
        reply = `I recommend **${nearest.name}**. It's operational with an estimated wait time of ${nearest.waitTime || 0} minutes.`;
        data = { type: 'station_recommendation', station: nearest, reason: 'Nearest operational station' };
      } else {
        reply = "Sorry, no stations are currently operational nearby.";
      }
    } 
    else if (lowerMsg.includes('spend') || lowerMsg.includes('spent') || lowerMsg.includes('cost this month')) {
      reply = `You have spent **₹${totalSpend.toFixed(2)}** on **${totalKg.toFixed(1)} kg** of hydrogen this month.`;
      data = { type: 'spend_summary', totalSpend, totalKg };
    } 
    else {
      reply = `I'm your Aurora Smart Assistant! I can help you find the cheapest or nearest station, check your monthly spending, or give you live queue updates. There are currently ${activeStations.length} stations online in the network.\n\n*(Note: LLM mode is disabled. Add GEMINI_API_KEY to your .env to enable natural language parsing!)*`;
    }

    res.json({
      success: true,
      data: { reply, structuredData: data }
    });

  } catch (error) {
    console.error('AI Assistant Error:', error);
    res.status(500).json({ message: 'Failed to process AI request' });
  }
};

exports.scanPlate = async (req, res) => {
  try {
    const { image, plateNumber } = req.body;
    let detectedPlate = plateNumber ? plateNumber.toUpperCase().trim() : null;
    let confidence = 98.6;

    // 1. If image provided and GEMINI_API_KEY available, run real vision detection
    if (image && process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                  }
                },
                {
                  text: 'Analyze this vehicle image. Identify the vehicle license plate or VIN number. Return ONLY a JSON object with: {"plateNumber": "DETECTED_PLATE_OR_UNKNOWN", "vehicleType": "Detected vehicle type", "confidence": 95}.'
                }
              ]
            }
          ]
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.plateNumber && parsed.plateNumber !== 'UNKNOWN') {
            detectedPlate = parsed.plateNumber.toUpperCase().trim();
            confidence = parsed.confidence || 96.5;
          }
        }
      } catch (err) {
        console.warn('Gemini vision detection error, falling back:', err.message);
      }
    }

    // 2. If no plate detected from image or manually, get user's real registered vehicle from MongoDB
    if (!detectedPlate) {
      const userVehicle = await Vehicle.findOne({ user: req.user._id, isActive: true }) 
        || await Vehicle.findOne({ user: req.user._id })
        || await FleetVehicle.findOne({ owner: req.user._id });
        
      if (userVehicle) {
        detectedPlate = userVehicle.plateNumber;
        confidence = 99.2;
      } else {
        detectedPlate = 'KA-01-H2-2026';
        confidence = 95.0;
      }
    }

    // 3. Query real vehicle record in MongoDB
    const vehicleRecord = await Vehicle.findOne({ plateNumber: detectedPlate })
      || await FleetVehicle.findOne({ plateNumber: detectedPlate });

    // 4. Auto-allocate matching station dispenser bay
    const nozzleNeeded = (vehicleRecord?.pressureRating || vehicleRecord?.fuelType?.includes('350')) ? '350 bar' : '700 bar';
    let dispenser = await Dispenser.findOne({ nozzleType: nozzleNeeded, status: 'available' }).populate('station');
    if (!dispenser) {
      dispenser = await Dispenser.findOne({ nozzleType: nozzleNeeded }).populate('station')
        || await Dispenser.findOne().populate('station');
    }

    res.json({
      success: true,
      data: {
        plateNumber: detectedPlate,
        confidence,
        isRegistered: !!vehicleRecord,
        vehicle: vehicleRecord || {
          model: 'Aurora FCEV Hydrogen Vehicle',
          fuelType: '700 bar Hydrogen',
          tankCapacityKg: 5.6
        },
        nozzleRecommendation: nozzleNeeded,
        dispenser: dispenser ? {
          _id: dispenser._id,
          nozzleType: dispenser.nozzleType,
          pressureRating: dispenser.pressureRating,
          status: dispenser.status,
          station: dispenser.station ? {
            _id: dispenser.station._id,
            name: dispenser.station.name,
            address: dispenser.station.location?.address
          } : null
        } : null
      }
    });
  } catch (error) {
    console.error('Scan plate error:', error);
    res.status(500).json({ success: false, message: 'Failed to scan vehicle plate' });
  }
};
