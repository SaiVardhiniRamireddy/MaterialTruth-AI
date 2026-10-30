import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { User } from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { message: 'Too many attempts. Try again in a few minutes.' } } });

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a number'),
});
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').max(128),
});

router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    if (await User.exists({ email: data.email })) throw new ApiError(409, 'An account with this email already exists');
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({ name: data.name, email: data.email, passwordHash });
    res.status(201).json({ success: true, data: { token: signToken(user), user: user.toPublic() } });
  })
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email }).select('+passwordHash');
    // Same message for unknown email and wrong password to avoid account enumeration.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new ApiError(401, 'Invalid email or password');
    res.json({ success: true, data: { token: signToken(user), user: user.toPublic() } });
  })
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, data: { user: req.user.toPublic() } });
});

export default router;
