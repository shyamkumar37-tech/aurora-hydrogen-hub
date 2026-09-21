const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('Auth Endpoints', () => {
  it('should register a new user with hashed password and return valid JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    
    const userInDb = await User.findOne({ email: 'admin@test.com' });
    expect(userInDb).toBeTruthy();
    
    // Verify password is hashed
    const isMatch = await bcrypt.compare('password123', userInDb.password);
    expect(isMatch).toBe(true);
    expect(userInDb.password).not.toEqual('password123');
  });

  it('should reject login with wrong password', async () => {
    // Create a user first
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Customer',
        email: 'customer@test.com',
        password: 'password123',
        role: 'customer'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customer@test.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body).not.toHaveProperty('token');
    expect(res.body.message).toMatch(/Invalid email or password/i);
  });

  it('should reject access to protected route without token', async () => {
    // Try to access a protected route (e.g. GET /api/stations admin logic or similar)
    // Here we use GET /api/inventory which requires auth
    const res = await request(app).get('/api/inventory');
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toMatch(/Not authorized/i);
  });

  it('should block unauthorized roles (authorize middleware)', async () => {
    // Register customer
    const customerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Customer',
        email: 'customer2@test.com',
        password: 'password123',
        role: 'customer'
      });

    // Customer tries to access admin analytics
    const res = await request(app)
      .get('/api/analytics/revenue')
      .set('Authorization', `Bearer ${customerRes.body.token}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toMatch(/User role not authorized/i);
  });
});
