const { z } = require('zod');

// 1. Auth Schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  role: z.enum(['customer', 'staff', 'admin']).optional(),
  vehicleNumber: z.string().optional(),
  vehicleModel: z.string().optional(),
  fuelType: z.string().optional(),
  tankCapacity: z.number().positive().optional()
});


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// 2. Booking Schemas
const createBookingSchema = z.object({
  stationId: z.string().min(1, 'Station ID is required'),
  slotStartTime: z.string().or(z.date()),
  amountKg: z.number().positive('Quantity must be greater than 0'),
  vehicleNumber: z.string().optional(),
  dispenserId: z.string().optional()
});

// 3. Dispenser Schemas
const updateDispenserStatusSchema = z.object({
  status: z.enum(['available', 'busy', 'maintenance', 'offline']),
  pressureBar: z.number().min(0).max(1000).optional(),
  temperatureCryo: z.number().optional()
});

// 4. Station Schemas
const updateStationStatusSchema = z.object({
  status: z.enum(['operational', 'busy', 'maintenance', 'closed']),
  pricePerKg: z.number().positive().optional()
});

// Generic validation middleware creator
const validate = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    return res.status(400).json({ success: false, message: 'Invalid payload' });
  }
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createBookingSchema,
  updateDispenserStatusSchema,
  updateStationStatusSchema
};
