import { Router } from 'express';
import { signup, login, logout, me, signupStatus } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();

authRouter.get('/signup-status', asyncHandler(signupStatus));
authRouter.post('/signup', asyncHandler(signup));
authRouter.post('/login', asyncHandler(login));
authRouter.post('/logout', asyncHandler(logout));
authRouter.get('/me', requireAuth, asyncHandler(me));
