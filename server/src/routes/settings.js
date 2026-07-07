import { Router } from 'express';
import { getSettingsHandler, updateSettings } from '../controllers/settingsController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const settingsRouter = Router();
settingsRouter.use(requireAuth);
settingsRouter.get('/', asyncHandler(getSettingsHandler));
settingsRouter.put('/', asyncHandler(updateSettings));
