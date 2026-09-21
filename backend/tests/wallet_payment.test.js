const request = require('supertest');
const app = require('../server');
const Station = require('../models/Station');
const Dispenser = require('../models/Dispenser');
const Booking = require('../models/Booking');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

let customerToken;
let customerId;
let testStationId;
let testDispenserId;
let testBookingId;

beforeEach(async () => {
  // Register Customer
  const res = await request(app).post('/api/auth/register').send({
    name: 'Wallet Cust',
    email: `cust_${Date.now()}@test.com`,
    password: 'password123',
    role: 'customer'
  });
  customerToken = res.body.token;
  customerId = res.body._id;

  // Register Admin to create station
  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Admin Pay',
    email: `admin_${Date.now()}@test.com`,
    password: 'password123',
    role: 'admin'
  });

  // Create Station
  const stRes = await request(app)
    .post('/api/stations')
    .set('Authorization', `Bearer ${adminRes.body.token}`)
    .send({ name: 'H2 Express Hub', location: { address: 'Tech Corridor' }, capacity: 200, status: 'active' });
  testStationId = stRes.body._id;

  // Create Dispenser
  const dispRes = await request(app)
    .post('/api/dispensers')
    .set('Authorization', `Bearer ${adminRes.body.token}`)
    .send({ station: testStationId, nozzleType: '700 bar', pressureRating: 700, status: 'available' });
  testDispenserId = dispRes.body._id;

  // Create Booking
  const bkRes = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ station: testStationId, dispenser: testDispenserId, slotTime: new Date().toISOString() });
  testBookingId = bkRes.body._id;
});

describe('UPI & Razorpay Payment & Wallet Flows', () => {

  it('creates an order for wallet top-up', async () => {
    const res = await request(app)
      .post('/api/wallet/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ amount: 1000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.amount).toBe(100000); // in paise
    expect(res.body.currency).toBe('INR');
  });

  it('credits wallet balance via Direct UPI verification', async () => {
    const res = await request(app)
      .post('/api/wallet/verify-payment')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        amount: 1500,
        paymentMethod: 'upi',
        upi_txn_id: 'upi_test_987654',
        upi_utr: 'UTR9876543210'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.newBalance).toBe(1500);

    // Verify User record updated
    const user = await User.findById(customerId);
    expect(user.walletBalance).toBe(1500);

    // Verify Wallet Transaction record created
    const tx = await WalletTransaction.findOne({ razorpayPaymentId: 'upi_test_987654' });
    expect(tx).not.toBeNull();
    expect(tx.source).toBe('upi');
    expect(tx.amount).toBe(1500);
  });

  it('rejects duplicate payment submission and prevents double crediting (Idempotency)', async () => {
    // 1st submission
    await request(app)
      .post('/api/wallet/verify-payment')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        amount: 1000,
        paymentMethod: 'upi',
        upi_txn_id: 'upi_duplicate_check_1',
        upi_utr: 'UTR_DUP_001'
      });

    // 2nd identical submission (e.g. network retry or replay)
    const res2 = await request(app)
      .post('/api/wallet/verify-payment')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        amount: 1000,
        paymentMethod: 'upi',
        upi_txn_id: 'upi_duplicate_check_1',
        upi_utr: 'UTR_DUP_001'
      });

    expect(res2.statusCode).toBe(200);
    expect(res2.body.alreadyProcessed).toBe(true);

    // Verify balance is still 1000, not 2000
    const user = await User.findById(customerId);
    expect(user.walletBalance).toBe(1000);
  });

  it('credits wallet balance via Razorpay gateway simulation/verification', async () => {
    const res = await request(app)
      .post('/api/wallet/verify-payment')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        amount: 800,
        paymentMethod: 'razorpay',
        razorpay_payment_id: 'pay_test_rzp_111',
        razorpay_order_id: 'order_test_rzp_111'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.newBalance).toBe(800);

    const user = await User.findById(customerId);
    expect(user.walletBalance).toBe(800);
  });

  it('confirms refueling slot booking via Direct UPI', async () => {
    const res = await request(app)
      .post('/api/payments/process-payment')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: testBookingId,
        paymentMethod: 'upi',
        amount: 500,
        upi_utr: 'UTR_SLOT_123',
        upi_txn_id: 'txn_upi_slot_123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.paymentMethod).toBe('upi');
    expect(res.body.booking.status).toBe('confirmed');

    const updatedBooking = await Booking.findById(testBookingId);
    expect(updatedBooking.status).toBe('confirmed');
  });

  it('confirms refueling slot booking via Razorpay / Card', async () => {
    const res = await request(app)
      .post('/api/payments/process-payment')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: testBookingId,
        paymentMethod: 'razorpay',
        amount: 500,
        razorpay_payment_id: 'pay_slot_rzp_999',
        razorpay_order_id: 'order_slot_rzp_999'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.status).toBe('confirmed');
  });

  it('credits wallet balance via Stripe gateway simulation/verification', async () => {
    const res = await request(app)
      .post('/api/wallet/verify-payment')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        amount: 2500,
        paymentMethod: 'stripe',
        stripe_payment_id: 'pi_test_stripe_777',
        stripe_charge_id: 'ch_test_stripe_777'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.newBalance).toBe(2500);

    const user = await User.findById(customerId);
    expect(user.walletBalance).toBe(2500);

    const tx = await WalletTransaction.findOne({ razorpayPaymentId: 'pi_test_stripe_777' });
    expect(tx).not.toBeNull();
    expect(tx.source).toBe('stripe');
    expect(tx.amount).toBe(2500);
  });

  it('confirms refueling slot booking via Stripe', async () => {
    const res = await request(app)
      .post('/api/payments/process-payment')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: testBookingId,
        paymentMethod: 'stripe',
        amount: 500,
        stripe_payment_id: 'pi_slot_stripe_888',
        stripe_charge_id: 'ch_slot_stripe_888'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.paymentMethod).toBe('stripe');
    expect(res.body.booking.status).toBe('confirmed');

    const updatedBooking = await Booking.findById(testBookingId);
    expect(updatedBooking.status).toBe('confirmed');
  });

});

