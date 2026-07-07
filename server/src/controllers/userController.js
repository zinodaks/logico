import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ApiError } from '../middleware/errorHandler.js';

function toPublicUser(user) {
  return { id: user._id, email: user.email, name: user.name, active: user.active };
}

export async function listUsers(req, res) {
  const users = await User.find().sort({ name: 1 });
  res.json({ users: users.map(toPublicUser) });
}

export async function createUser(req, res) {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    throw new ApiError(400, 'email, password, and name are required');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'A user with that email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, name });
  res.status(201).json({ user: toPublicUser(user) });
}

export async function updateUser(req, res) {
  const { name, active } = req.body;
  const update = {};
  if (name !== undefined) update.name = name;
  if (active !== undefined) update.active = active;

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user: toPublicUser(user) });
}

export async function resetPassword(req, res) {
  const { password } = req.body;
  if (!password || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.findByIdAndUpdate(req.params.id, { passwordHash }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user: toPublicUser(user) });
}
