import { Router } from 'express';
import {
  listProfitTransfers,
  createProfitTransfer,
  deleteProfitTransfer,
} from '../controllers/profitTransferController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const profitTransfersRouter = Router();
profitTransfersRouter.use(requireAuth);

profitTransfersRouter.get('/', asyncHandler(listProfitTransfers));
profitTransfersRouter.post('/', asyncHandler(createProfitTransfer));
profitTransfersRouter.delete('/:id', asyncHandler(deleteProfitTransfer));
