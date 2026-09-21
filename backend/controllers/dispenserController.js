const Dispenser = require('../models/Dispenser');
const Station = require('../models/Station');
const Vehicle = require('../models/Vehicle');
const Inventory = require('../models/Inventory');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Booking = require('../models/Booking');
const QRCode = require('qrcode');

exports.getDispensers = async (req, res) => {
  try {
    const filter = req.query.station ? { station: req.query.station } : {};
    const dispensers = await Dispenser.find(filter).populate('station');
    res.json(dispensers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getDispenserById = async (req, res) => {
  try {
    const dispenser = await Dispenser.findById(req.params.id).populate('station');
    if (!dispenser) {
      return res.status(404).json({ message: 'Dispenser not found' });
    }
    res.json(dispenser);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createDispenser = async (req, res) => {
  try {
    const dispenser = new Dispenser(req.body);
    const createdDispenser = await dispenser.save();
    res.status(201).json(createdDispenser);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
};

exports.updateDispenser = async (req, res) => {
  try {
    const dispenser = await Dispenser.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (dispenser) {
      res.json(dispenser);
    } else {
      res.status(404).json({ message: 'Dispenser not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
};

exports.deleteDispenser = async (req, res) => {
  try {
    const dispenser = await Dispenser.findByIdAndDelete(req.params.id);
    if (dispenser) {
      res.json({ message: 'Dispenser removed' });
    } else {
      res.status(404).json({ message: 'Dispenser not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.generateDispenserQR = async (req, res) => {
  try {
    const dispenser = await Dispenser.findById(req.params.id);
    if (!dispenser) {
      return res.status(404).json({ message: 'Dispenser not found' });
    }

    const checkoutUrl = `http://localhost:5173/checkout/dispenser/${dispenser._id}`;
    
    const qrDataUrl = await QRCode.toDataURL(checkoutUrl, {
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      width: 300
    });

    res.json({ qrCode: qrDataUrl, url: checkoutUrl });
  } catch (error) {
    res.status(500).json({ message: 'Error generating QR code' });
  }
};

exports.simulatePump = async (req, res) => {
  try {
    const dispenser = await Dispenser.findById(req.params.id).populate('station');
    if (!dispenser) {
      return res.status(404).json({ message: 'Dispenser not found' });
    }

    // Identify user's active vehicle
    const vehicle = await Vehicle.findOne({ user: req.user._id, isActive: true }) 
      || await Vehicle.findOne({ user: req.user._id });

    // Determine target fuel amount based on real vehicle tank capacity
    let maxFuel = 5.0; // kg default
    if (vehicle) {
      const cap = vehicle.tankCapacityKg || 5.6;
      const currentLevel = vehicle.currentFuelLevelPct || 35;
      const needed = (cap * (100 - currentLevel)) / 100;
      maxFuel = Math.max(1.5, parseFloat(needed.toFixed(2)));
    }

    const pricePerKg = dispenser.station?.pricePerKg || dispenser.station?.hydrogenPrice || 82;

    // Set dispenser status to fueling
    dispenser.status = 'fueling';
    await dispenser.save();
    if (req.io) {
      req.io.emit('dispenser_status_changed', { dispenserId: dispenser._id, stationId: dispenser.station?._id, status: 'fueling' });
    }

    let currentFuel = 0;
    const interval = setInterval(async () => {
      currentFuel += 0.5;
      const roundedFuel = parseFloat(currentFuel.toFixed(2));
      const currentCost = parseFloat((roundedFuel * pricePerKg).toFixed(2));

      if (req.io) {
        req.io.emit('fuelFlowing', {
          dispenserId: dispenser._id,
          currentAmount: roundedFuel,
          maxAmount: maxFuel,
          currentCost,
          pricePerKg,
          pressure: Math.floor(Math.random() * (720 - 680 + 1) + 680)
        });
      }

      if (currentFuel >= maxFuel) {
        clearInterval(interval);
        
        try {
          // 1. Reset dispenser back to available
          dispenser.status = 'available';
          await dispenser.save();

          // 2. Debit inventory
          const stationId = dispenser.station?._id || dispenser.station;
          await Inventory.findOneAndUpdate(
            { station: stationId },
            { $inc: { currentStock: -maxFuel } }
          );

          // 3. Top up vehicle tank to 100% in garage
          if (vehicle) {
            vehicle.currentFuelLevelPct = 100;
            const efficiency = vehicle.efficiencyKgPer100Km || 0.95;
            vehicle.estimatedRangeKm = Math.round((vehicle.tankCapacityKg / efficiency) * 100);
            await vehicle.save();
          }

          // 4. Check for existing active booking
          const activeBooking = await Booking.findOne({
            user: req.user._id,
            dispenser: dispenser._id,
            status: { $in: ['pending', 'confirmed', 'active'] }
          });
          if (activeBooking) {
            activeBooking.status = 'completed';
            await activeBooking.save();
          }

          // 5. Create real Transaction in MongoDB
          const finalCost = parseFloat((maxFuel * pricePerKg).toFixed(2));
          const tx = new Transaction({
            booking: activeBooking ? activeBooking._id : undefined,
            dispenser: dispenser._id,
            vehicle: vehicle ? vehicle._id : undefined,
            user: req.user._id,
            station: stationId,
            quantityDispensed: maxFuel,
            cost: finalCost,
            paymentStatus: 'paid'
          });
          const savedTx = await tx.save();

          // 6. Award loyalty points (+10 pts per kg)
          const user = await User.findById(req.user._id);
          if (user) {
            user.loyaltyPoints = (user.loyaltyPoints || 0) + Math.round(maxFuel * 10);
            if (user.loyaltyPoints >= 500) user.tier = 'Platinum';
            else if (user.loyaltyPoints >= 200) user.tier = 'Gold';
            else if (user.loyaltyPoints >= 50) user.tier = 'Silver';
            await user.save();
          }

          if (req.io) {
            req.io.emit('fuelComplete', {
              dispenserId: dispenser._id,
              stationId,
              transactionId: savedTx._id,
              quantity: maxFuel,
              cost: finalCost,
              vehicleModel: vehicle?.model || 'Fuel Cell Vehicle',
              newLoyaltyPoints: user?.loyaltyPoints || 0
            });
            req.io.emit('inventoryUpdated', { stationId });
            req.io.emit('dispenser_status_changed', { dispenserId: dispenser._id, stationId, status: 'available' });
          }
        } catch (postErr) {
          console.error('Error concluding pump session:', postErr);
        }
      }
    }, 450);

    res.json({
      message: 'Pumping initiated on SAE J2601 protocol',
      maxFuel,
      pricePerKg,
      vehicleModel: vehicle?.model || 'Hydrogen Vehicle'
    });
  } catch (error) {
    console.error('Simulate pump error:', error);
    res.status(500).json({ message: 'Error starting pump' });
  }
};

