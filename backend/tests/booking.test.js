const request = require('supertest');
const app = require('../server');
const Station = require('../models/Station');
const Dispenser = require('../models/Dispenser');
const MaintenanceLog = require('../models/MaintenanceLog');
const mongoose = require('mongoose');

let customerToken;
let adminToken;
let testStationId;
let testDispenserId;

beforeEach(async () => {
  // Register Customer
  const custRes = await request(app).post('/api/auth/register').send({
    name: 'Cust', email: 'cust@test.com', password: 'pass', role: 'customer'
  });
  customerToken = custRes.body.token;

  // Register Admin
  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Admin', email: 'admin@test.com', password: 'pass', role: 'admin'
  });
  adminToken = adminRes.body.token;

  // Create Station
  const stationRes = await request(app)
    .post('/api/stations')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test Station', location: { address: '123 Test St' }, capacity: 100, status: 'active' });
  testStationId = stationRes.body._id;

  // Create Dispenser
  const dispenserRes = await request(app)
    .post('/api/dispensers')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ station: testStationId, nozzleType: '700 bar', pressureRating: 700, status: 'available' });
  testDispenserId = dispenserRes.body._id;
});

describe('Booking Conflict & Maintenance Logic', () => {
  
  it('should prevent overlapping bookings for the same dispenser', async () => {
    const slotTime = new Date('2030-01-01T10:00:00Z').toISOString();
    
    // First booking succeeds
    const res1 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ station: testStationId, dispenser: testDispenserId, slotTime });
    
    expect(res1.statusCode).toEqual(201);

    // Overlapping booking fails
    const res2 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ station: testStationId, dispenser: testDispenserId, slotTime });
    
    expect(res2.statusCode).toEqual(409);
    expect(res2.body.message).toMatch(/overlaps/i);
  });

  it('should reject booking if slot overlaps an active maintenance block', async () => {
    const slotTime = new Date('2030-01-01T14:00:00Z').toISOString();

    // Admin schedules maintenance
    await request(app)
      .post('/api/maintenance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        station: testStationId,
        dispenser: testDispenserId,
        issue: 'Routine check',
        technician: 'John',
        startTime: new Date('2030-01-01T13:30:00Z').toISOString(),
        endTime: new Date('2030-01-01T14:30:00Z').toISOString()
      });

    // Customer tries to book in that window
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ station: testStationId, dispenser: testDispenserId, slotTime });

    expect(res.statusCode).toEqual(409);
    expect(res.body.message).toMatch(/scheduled maintenance/i);
  });
});
