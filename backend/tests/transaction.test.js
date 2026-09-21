const request = require('supertest');
const app = require('../server');
const Station = require('../models/Station');
const Dispenser = require('../models/Dispenser');
const Inventory = require('../models/Inventory');
const Booking = require('../models/Booking');

let customerToken;
let staffToken;
let testStationId;
let testDispenserId;
let testBookingId;
let testInventoryId;

beforeEach(async () => {
  // Register Customer
  let res = await request(app).post('/api/auth/register').send({
    name: 'Cust', email: 'cust@test.com', password: 'pass', role: 'customer'
  });
  customerToken = res.body.token;

  // Register Staff
  res = await request(app).post('/api/auth/register').send({
    name: 'Staff', email: 'staff@test.com', password: 'pass', role: 'staff'
  });
  staffToken = res.body.token;

  // Register Admin to create station
  res = await request(app).post('/api/auth/register').send({
    name: 'Admin', email: 'admin@test.com', password: 'pass', role: 'admin'
  });
  const adminToken = res.body.token;

  // Create Station
  res = await request(app)
    .post('/api/stations')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test Station', location: { address: '123' }, capacity: 100, status: 'active' });
  testStationId = res.body._id;

  // Create Dispenser
  res = await request(app)
    .post('/api/dispensers')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ station: testStationId, nozzleType: '700 bar', pressureRating: 700, status: 'available' });
  testDispenserId = res.body._id;

  // Get Inventory ID
  const inv = await Inventory.findOne({ station: testStationId });
  testInventoryId = inv._id;

  // Refill Inventory to 50
  await request(app)
    .put(`/api/inventory/${testInventoryId}`)
    .set('Authorization', `Bearer ${staffToken}`)
    .send({ amountToAdd: 50 });

  // Create Booking
  res = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ station: testStationId, dispenser: testDispenserId, slotTime: new Date().toISOString() });
  testBookingId = res.body._id;
});

describe('Transaction & Inventory Flow', () => {

  it('completing a booking deducts inventory, creates a transaction, and updates status', async () => {
    const res = await request(app)
      .post('/api/transactions/complete')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ bookingId: testBookingId, quantityDispensed: 10, cost: 50 });

    expect(res.statusCode).toEqual(201);
    expect(res.body.quantityDispensed).toBe(10);
    expect(res.body.paymentStatus).toBe('paid');

    // Check inventory deducted
    const inv = await Inventory.findById(testInventoryId);
    expect(inv.currentStock).toBe(40); // 50 - 10

    // Check booking status
    const booking = await Booking.findById(testBookingId);
    expect(booking.status).toBe('completed');
  });

  it('cannot complete the same booking twice', async () => {
    await request(app)
      .post('/api/transactions/complete')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ bookingId: testBookingId, quantityDispensed: 10, cost: 50 });

    // Try again
    const res = await request(app)
      .post('/api/transactions/complete')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ bookingId: testBookingId, quantityDispensed: 5, cost: 25 });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/Booking is already completed|Transaction already exists/i);
  });

  it('cannot deduct more fuel than currentStock', async () => {
    const res = await request(app)
      .post('/api/transactions/complete')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ bookingId: testBookingId, quantityDispensed: 100, cost: 500 }); // Stock is only 50

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/Not enough stock/i);
  });

  it('low-stock flag correctly triggers when currentStock drops below threshold', async () => {
    // Current stock is 50, default threshold is 20
    // Refill to 50
    // Complete booking for 40 -> stock becomes 10 (< 20)
    await request(app)
      .post('/api/transactions/complete')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ bookingId: testBookingId, quantityDispensed: 40, cost: 200 });

    const inv = await Inventory.findById(testInventoryId);
    expect(inv.currentStock).toBe(10);
    
    // Check API response for flag
    const res = await request(app)
      .get('/api/inventory')
      .set('Authorization', `Bearer ${staffToken}`);
    
    const targetInv = res.body.find(i => i._id === testInventoryId.toString());
    expect(targetInv.isLowStock).toBe(true);
  });
});
