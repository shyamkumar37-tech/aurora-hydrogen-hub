const mongoose = require('mongoose');

const seedDefaultData = async () => {
  try {
    const User = require('../models/User');
    const Station = require('../models/Station');
    const Dispenser = require('../models/Dispenser');

    const adminExists = await User.findOne({ email: 'admin@test.com' });
    if (!adminExists) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      });
      console.log('Seeded default admin (admin@test.com / password123)');
    }

    const customerExists = await User.findOne({ email: 'customer@example.com' });
    if (!customerExists) {
      await User.create({
        name: 'Eco Customer',
        email: 'customer@example.com',
        password: 'password123',
        role: 'customer'
      });
      console.log('Seeded default customer (customer@example.com / password123)');
    }

    const staffExists = await User.findOne({ email: 'chennai_staff@h2.com' });
    if (!staffExists) {
      await User.create({
        name: 'Chennai Station Lead',
        email: 'chennai_staff@h2.com',
        password: 'password123',
        role: 'staff'
      });
      console.log('Seeded default staff (chennai_staff@h2.com / password123)');
    }

    const count = await Station.countDocuments();
    if (count === 0) {
      const stations = await Station.create([
        { name: 'Downtown Hydrogen Hub', status: 'active', location: { type: 'Point', coordinates: [-122.4194, 37.7749] } },
        { name: 'Eastside Clean Energy', status: 'active', location: { type: 'Point', coordinates: [-122.4082, 37.7831] } },
        { name: 'Chennai Central H2 Station', status: 'active', location: { type: 'Point', coordinates: [80.2707, 13.0827] } }
      ]);
      await Dispenser.create([
        { station: stations[0]._id, nozzleType: '700 bar', pressureRating: 700, status: 'available' },
        { station: stations[0]._id, nozzleType: '350 bar', pressureRating: 350, status: 'available' },
        { station: stations[1]._id, nozzleType: '700 bar', pressureRating: 700, status: 'available' },
        { station: stations[2]._id, nozzleType: '700 bar', pressureRating: 700, status: 'available' }
      ]);
      console.log('Seeded default stations and dispensers');
    }
  } catch (err) {
    console.warn('Auto-seeding skipped or failed:', err.message);
  }
};

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://localhost:27017/h2station';
  
  try {
    console.log(`Connecting to primary MongoDB URI...`);
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 4000
    });
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    await seedDefaultData();
    return;
  } catch (primaryErr) {
    console.warn(`Primary MongoDB connection failed (${primaryErr.message}). Initiating fallback...`);
  }

  // Cloud/Render fallback: Try MongoMemoryServer so service stays up and responsive
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('Starting in-memory fallback MongoDB server...');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`Fallback In-Memory MongoDB Connected at: ${conn.connection.host}`);
    await seedDefaultData();
  } catch (fallbackErr) {
    console.error('All MongoDB connection options failed:', fallbackErr.message);
    console.log('HTTP server will remain running in degraded mode to serve health checks and API errors.');
  }
};

module.exports = connectDB;
