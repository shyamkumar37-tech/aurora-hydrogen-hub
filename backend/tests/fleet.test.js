const request = require('supertest');
const app = require('../server');
const FleetVehicle = require('../models/FleetVehicle');

let token;

beforeEach(async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Fleet Operator',
    email: `fleet_${Date.now()}@test.com`,
    password: 'password123',
    role: 'customer'
  });
  token = res.body.token;
});

describe('Fleet Management API (/api/fleet)', () => {
  it('should add a new vehicle to the corporate fleet', async () => {
    const res = await request(app)
      .post('/api/fleet')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vin: 'H2TRUCK9988776655',
        plateNumber: 'KA-01-H2-9988',
        model: 'Hyundai XCIENT Fuel Cell 4x2',
        vehicleType: 'Heavy Duty Truck',
        tankCapacityKg: 31,
        pressureRating: '700 bar',
        assignedDriver: {
          name: 'Rajesh Kumar',
          licenseNumber: 'DL-KA-H2-4411',
          phone: '+91 98765 43210'
        },
        dailyLimitKg: 25
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plateNumber).toBe('KA-01-H2-9988');
    expect(res.body.data.tankCapacityKg).toBe(31);
  });

  it('should prevent duplicate vehicle plate numbers in the same fleet', async () => {
    await request(app)
      .post('/api/fleet')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vin: 'H2BUS1122334455',
        plateNumber: 'KA-05-H2-1234',
        model: 'Solaris Urbino 12 H2',
        assignedDriver: { name: 'Driver 1' }
      });

    const res = await request(app)
      .post('/api/fleet')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vin: 'H2BUS1122334455_DUP',
        plateNumber: 'KA-05-H2-1234',
        model: 'Another Truck',
        assignedDriver: { name: 'Driver 2' }
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('should retrieve fleet vehicles with calculated ESG metrics', async () => {
    await request(app)
      .post('/api/fleet')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vin: 'H2VAN11223344',
        plateNumber: 'KA-03-H2-5566',
        model: 'Toyota Mirai Fleet Edition',
        vehicleType: 'Passenger Sedan',
        tankCapacityKg: 5.6,
        assignedDriver: { name: 'Vikram Singh' }
      });

    const res = await request(app)
      .get('/api/fleet')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.stats.totalVehicles).toBe(1);
    expect(res.body.stats.activeVehicles).toBe(1);
  });

  it('should update fleet vehicle status and quota', async () => {
    const createRes = await request(app)
      .post('/api/fleet')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vin: 'H2TRUCK554433',
        plateNumber: 'KA-04-H2-7788',
        model: 'Nikola Tre FCEV',
        assignedDriver: { name: 'Anil Rao' }
      });

    const vehicleId = createRes.body.data._id;

    const updateRes = await request(app)
      .put(`/api/fleet/${vehicleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'In Maintenance',
        dailyLimitKg: 40
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.status).toBe('In Maintenance');
    expect(updateRes.body.data.dailyLimitKg).toBe(40);
  });
});
