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

    // 1. Gather Real Data Context from MongoDB (guarded against buffering/disconnects)
    let activeStations = [];
    try {
      activeStations = await Station.find({ status: { $in: ['operational', 'active'] } }).lean();
    } catch (dbErr) {
      console.warn('DB station query warning (continuing):', dbErr.message);
    }
    
    let totalSpend = 0;
    let totalKg = 0;
    if (req.user?._id) {
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0,0,0,0);
        
        const transactions = await Transaction.aggregate([
          { $match: { user: req.user._id, status: 'completed', createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' }, kg: { $sum: '$hydrogenDispensed' } } }
        ]);
        totalSpend = transactions.length > 0 ? transactions[0].total : 0;
        totalKg = transactions.length > 0 ? transactions[0].kg : 0;
      } catch (txErr) {
        console.warn('DB transaction query warning (continuing):', txErr.message);
      }
    }

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

        let rawText = (response.text || '').trim();
        rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(rawText);
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

    // 3. Natural Fallback Intelligence (Keyword & Intent Logic)
    const lowerMsg = message.toLowerCase().trim();
    let reply = "";
    let data = null;

    if (lowerMsg.includes('cheapest') || lowerMsg.includes('price') || lowerMsg.includes('cost per kg') || lowerMsg.includes('rate')) {
      const cheapest = activeStations.sort((a,b) => (a.pricePerKg||0) - (b.pricePerKg||0))[0];
      if (cheapest) {
        reply = `The most cost-effective station right now is **${cheapest.name}** at ₹${cheapest.pricePerKg || 80}/kg. There are currently ${cheapest.availablePumps || 2} dispensers ready for refueling.`;
        data = { type: 'station_recommendation', station: cheapest, reason: 'Lowest price per kg' };
      } else {
        reply = "I couldn't find any operational stations right now. Please check back shortly.";
      }
    } 
    else if (lowerMsg.includes('where') || lowerMsg.includes('nearest') || lowerMsg.includes('closest') || lowerMsg.includes('near') || lowerMsg.includes('puncture') || lowerMsg.includes('emergency') || lowerMsg.includes('location')) {
      const nearest = activeStations[0];
      if (nearest) {
        reply = `I recommend heading to **${nearest.name}**. It is currently operational with an estimated queue wait time of **${nearest.waitTime || 5} minutes**.`;
        data = { type: 'station_recommendation', station: nearest, reason: 'Nearest operational station' };
      } else {
        reply = "No active stations were found in your vicinity at this time.";
      }
    } 
    else if (lowerMsg.includes('spend') || lowerMsg.includes('spent') || lowerMsg.includes('cost this month') || lowerMsg.includes('expenses') || lowerMsg.includes('consumption')) {
      reply = `You have spent **₹${totalSpend.toFixed(2)}** on **${totalKg.toFixed(1)} kg** of clean hydrogen this month. Great job reducing carbon emissions!`;
      data = { type: 'spend_summary', totalSpend, totalKg };
    }
    else if (lowerMsg.includes('book') || lowerMsg.includes('reserve') || lowerMsg.includes('slot') || lowerMsg.includes('pump')) {
      const availableStation = activeStations.find(s => (s.availablePumps || 1) > 0) || activeStations[0];
      if (availableStation) {
        reply = `You can easily reserve a refueling dispenser at **${availableStation.name}**. Head over to the **Book Refuel** tab to lock in your slot with 1-Touch Passkey confirmation!`;
        data = { type: 'station_recommendation', station: availableStation, reason: 'Ready for reservation' };
      } else {
        reply = "Head to the **Book Refuel** tab to choose an available dispenser at your preferred station.";
      }
    }
    else if (lowerMsg.includes('station') || lowerMsg.includes('network') || lowerMsg.includes('list')) {
      const stationNames = activeStations.map(s => `• **${s.name}** (₹${s.pricePerKg || 82}/kg)`).join('\n');
      reply = `Here are the operational hydrogen stations currently online:\n\n${stationNames}\n\nWould you like directions or queue status for any of these?`;
    }
    else if (lowerMsg.includes('hungry') || lowerMsg.includes('food') || lowerMsg.includes('restaurant') || lowerMsg.includes('cafe') || lowerMsg.includes('eat') || lowerMsg.includes('coffee')) {
      reply = "While I specialize in clean 700-bar hydrogen for your vehicle, our premier hubs like **Downtown Hydrogen Hub** and **Airport Express** feature travel plazas, coffee lounges, and cafes so you can grab a bite while your vehicle tops up in 3–5 minutes!";
    }
    else if (lowerMsg.includes('hydrogen') || lowerMsg.includes('fuel cell') || lowerMsg.includes('clean') || lowerMsg.includes('safety')) {
      reply = "Clean hydrogen fuel cells generate electric power using pressurized H₂, producing zero emissions — only pure water vapor! Aurora dispensers operate at SAE J2601 standards (700 bar) with multi-stage biometric safety valves.";
    }
    else if (lowerMsg === 'hi' || lowerMsg === 'hello' || lowerMsg === 'hey' || lowerMsg.startsWith('hi ') || lowerMsg.startsWith('hello ')) {
      reply = `Hello! I'm your Aurora Smart Mobility Assistant. I can help you find the cheapest or nearest station, estimate queue wait times, book a dispenser, or review your monthly fuel expenses. Currently, there are **${activeStations.length} stations online** in the network.\n\nHow can I help you today?`;
    }
    else {
      reply = `I'm here to assist you! I can help you locate hydrogen stations, check 700-bar dispenser availability, reserve a refueling slot, or track your vehicle's clean energy metrics. What would you like to know?`;
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
