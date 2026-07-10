import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { signup, login, logout, me, signupStatus } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

authRouter.get('/signup-status', asyncHandler(signupStatus));
authRouter.post('/signup', authLimiter, asyncHandler(signup));
authRouter.post('/login', authLimiter, asyncHandler(login));
authRouter.post('/logout', asyncHandler(logout));
authRouter.get('/me', requireAuth, asyncHandler(me));
