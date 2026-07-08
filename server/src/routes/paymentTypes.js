import { Router } from 'express';
import { PaymentType } from '../models/PaymentType.js';
import { buildSimpleCrudController } from '../utils/simpleCrud.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const controller = buildSimpleCrudController(PaymentType, ['name', 'category'], ['category']);

export const paymentTypesRouter = Router();
paymentTypesRouter.use(requireAuth);
paymentTypesRouter.get('/', asyncHandler(controller.list));
paymentTypesRouter.post('/', asyncHandler(controller.create));
paymentTypesRouter.patch('/:id', asyncHandler(controller.update));
paymentTypesRouter.delete('/:id', asyncHandler(controller.remove));
