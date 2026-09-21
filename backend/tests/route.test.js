const request = require('supertest');
const app = require('../server');
const Station = require('../models/Station');

describe('Hydrogen Route & Range Planner API', () => {
  let userToken;
  let testStationId;

  beforeEach(async () => {
    // Register user
    const res = await request(app).post('/api/auth/register').send({
      name: 'EcoRider',
      email: 'ecorider@test.com',
      password: 'password123',
      role: 'customer'
    });
    userToken = res.body.token;

    // Create sample hydrogen stations
    const station = await Station.create({
      name: 'Tambaram Clean Hydrogen Terminal',
      status: 'operational',
      location: {
        type: 'Point',
        coordinates: [80.1000, 12.9249]
      },
      availablePumps: 2,
      totalPumps: 4,
      pricePerKg: 16
    });
    testStationId = station._id;
  });

  it('should successfully compute route distance, fuel consumption, and recommend station stop', async () => {
    const res = await request(app)
      .post('/api/routes/plan')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        start: { lat: 13.0827, lng: 80.2707 },
        destination: { lat: 12.8342, lng: 79.7036 },
        tankCapacityKg: 5.6,
        currentFuelPct: 20, // low fuel to trigger refuel recommendation
        modelName: 'Toyota Mirai FCEV'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalDistanceKm).toBeGreaterThan(0);
    expect(res.body.data.fuelNeededTotalKg).toBeGreaterThan(0);
    expect(res.body.data.co2SavedKg).toBeGreaterThan(0);
    expect(res.body.data.waypoints).toBeDefined();
    expect(res.body.data.recommendedStop).toBeDefined();
  });

  it('should reject route computation if coordinates are missing', async () => {
    const res = await request(app)
      .post('/api/routes/plan')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        start: null,
        destination: { lat: 12.8342, lng: 79.7036 }
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/Start and destination coordinates are required/i);
  });
});
