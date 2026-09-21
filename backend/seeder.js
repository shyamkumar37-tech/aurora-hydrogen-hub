const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Station = require('./models/Station');
const Dispenser = require('./models/Dispenser');
const Transaction = require('./models/Transaction');
const Booking = require('./models/Booking');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/h2station');
    console.log('MongoDB Connected for Seeding');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    const adminExists = await User.findOne({ email: 'admin@test.com' });
    if (!adminExists) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      });
      console.log('Seeded admin@test.com account!');
    }

    const customerExists = await User.findOne({ email: 'customer@example.com' });
    if (!customerExists) {
      await User.create({
        name: 'Eco Customer',
        email: 'customer@example.com',
        password: 'password123',
        role: 'customer'
      });
      console.log('Seeded customer@example.com account!');
    }

    const staffExists = await User.findOne({ email: 'chennai_staff@h2.com' });
    if (!staffExists) {
      await User.create({
        name: 'Chennai Station Lead',
        email: 'chennai_staff@h2.com',
        password: 'password123',
        role: 'staff'
      });
      console.log('Seeded chennai_staff@h2.com account!');
    }

    const stationCount = await Station.countDocuments();
    let seededStations = [];
    if (stationCount === 0) {
      seededStations = await Station.create([
        { name: 'Downtown Hydrogen Hub', status: 'active', location: { type: 'Point', coordinates: [-122.4194, 37.7749] } },
        { name: 'Eastside Clean Energy', status: 'active', location: { type: 'Point', coordinates: [-122.4082, 37.7831] } },
        { name: 'North Route Refuel', status: 'maintenance', location: { type: 'Point', coordinates: [-122.4311, 37.8014] } }
      ]);
      console.log('Seeded 3 sample stations!');

      await Dispenser.create([
        { station: seededStations[0]._id, nozzleType: '700 bar', pressureRating: 700, status: 'available' },
        { station: seededStations[0]._id, nozzleType: '350 bar', pressureRating: 350, status: 'in-use' },
        { station: seededStations[1]._id, nozzleType: '700 bar', pressureRating: 700, status: 'available' }
      ]);
      console.log('Seeded sample dispensers!');
    }

    const transactionCount = await Transaction.countDocuments();
    if (transactionCount === 0 && seededStations.length > 0) {
      const fakeUser1 = await User.create({ name: 'EcoDriver99', email: 'eco1@test.com', password: 'password123', role: 'customer' });
      const fakeUser2 = await User.create({ name: 'H2Pioneer', email: 'eco2@test.com', password: 'password123', role: 'customer', tier: 'Silver' });
      
      const b1 = await Booking.create({ user: fakeUser1._id, station: seededStations[0]._id, dispenser: seededStations[0]._id, slotTime: new Date(), duration: 30, status: 'completed' });
      const b2 = await Booking.create({ user: fakeUser1._id, station: seededStations[1]._id, dispenser: seededStations[1]._id, slotTime: new Date(), duration: 30, status: 'completed' });
      const b3 = await Booking.create({ user: fakeUser2._id, station: seededStations[0]._id, dispenser: seededStations[0]._id, slotTime: new Date(), duration: 30, status: 'completed' });

      await Transaction.create([
        { user: fakeUser1._id, booking: b1._id, station: seededStations[0]?._id, quantityDispensed: 15, cost: 45, paymentStatus: 'paid' },
        { user: fakeUser1._id, booking: b2._id, station: seededStations[1]?._id, quantityDispensed: 10, cost: 30, paymentStatus: 'paid' },
        { user: fakeUser2._id, booking: b3._id, station: seededStations[0]?._id, quantityDispensed: 42, cost: 126, paymentStatus: 'paid' }
      ]);
      console.log('Seeded sample transactions for leaderboard!');
    }

    console.log('Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding failed: ${error}`);
    process.exit(1);
  }
};

seedData();
