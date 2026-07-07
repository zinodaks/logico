import { Router } from 'express';
import { Transporter } from '../models/Transporter.js';
import { buildSimpleCrudController } from '../utils/simpleCrud.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const controller = buildSimpleCrudController(Transporter, ['name', 'fixedTransportCost', 'currency']);

export const transportersRouter = Router();
transportersRouter.use(requireAuth);
transportersRouter.get('/', asyncHandler(controller.list));
transportersRouter.post('/', asyncHandler(controller.create));
transportersRouter.patch('/:id', asyncHandler(controller.update));
transportersRouter.delete('/:id', asyncHandler(controller.remove));
