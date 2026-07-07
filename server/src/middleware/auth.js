import { env } from '../config/env.js';
import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { ApiError } from './errorHandler.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[env.cookieName];
    if (!token) throw new ApiError(401, 'Not authenticated');

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user || !user.active) throw new ApiError(401, 'Not authenticated');

    req.user = user;
    next();
  } catch {
    next(new ApiError(401, 'Not authenticated'));
  }
}
