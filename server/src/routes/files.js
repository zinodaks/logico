import { Router } from 'express';
import {
  listFiles,
  getFile,
  createFile,
  updateFile,
  toggleStep,
  updateStatus,
  deleteFile,
} from '../controllers/fileController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const filesRouter = Router();
filesRouter.use(requireAuth);

filesRouter.get('/', asyncHandler(listFiles));
filesRouter.post('/', asyncHandler(createFile));
filesRouter.get('/:id', asyncHandler(getFile));
filesRouter.patch('/:id', asyncHandler(updateFile));
filesRouter.delete('/:id', asyncHandler(deleteFile));
filesRouter.patch('/:id/steps/:stepIndex', asyncHandler(toggleStep));
filesRouter.patch('/:id/status', asyncHandler(updateStatus));
