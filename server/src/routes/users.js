import { Router } from 'express';
import { listUsers, createUser, updateUser, resetPassword } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.get('/', asyncHandler(listUsers));
usersRouter.post('/', asyncHandler(createUser));
usersRouter.patch('/:id', asyncHandler(updateUser));
usersRouter.patch('/:id/password', asyncHandler(resetPassword));
