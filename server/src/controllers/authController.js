import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function setAuthCookie(res, user) {
  const token = signToken({ sub: user._id.toString() });
  res.cookie(env.cookieName, token, cookieOptions);
}

function toPublicUser(user) {
  return { id: user._id, email: user.email, name: user.name, active: user.active };
}

export async function signup(req, res) {
  const existingCount = await User.countDocuments();
  if (existingCount > 0) {
    throw new ApiError(403, 'Signup is closed. Ask an existing team member to create your account.');
  }

  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    throw new ApiError(400, 'email, password, and name are required');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, name });

  setAuthCookie(res, user);
  res.status(201).json({ user: toPublicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.active) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  setAuthCookie(res, user);
  res.json({ user: toPublicUser(user) });
}

export async function logout(req, res) {
  const { maxAge: _maxAge, ...clearOptions } = cookieOptions;
  res.clearCookie(env.cookieName, clearOptions);
  res.status(204).end();
}

export async function me(req, res) {
  res.json({ user: toPublicUser(req.user) });
}

export async function signupStatus(req, res) {
  const existingCount = await User.countDocuments();
  res.json({ signupOpen: existingCount === 0 });
}
