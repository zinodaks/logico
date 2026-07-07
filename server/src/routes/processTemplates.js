import { Router } from 'express';
import { getTemplate, putTemplate } from '../controllers/processTemplateController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const processTemplatesRouter = Router();
processTemplatesRouter.use(requireAuth);
processTemplatesRouter.get('/:type', asyncHandler(getTemplate));
processTemplatesRouter.put('/:type', asyncHandler(putTemplate));
