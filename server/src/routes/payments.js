import { Router } from 'express';
import {
  listPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
} from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

paymentsRouter.get('/', asyncHandler(listPayments));
paymentsRouter.post('/', asyncHandler(createPayment));
paymentsRouter.get('/:id', asyncHandler(getPayment));
paymentsRouter.patch('/:id', asyncHandler(updatePayment));
paymentsRouter.delete('/:id', asyncHandler(deletePayment));
