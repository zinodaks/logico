import { Router } from 'express';
import {
  getBalance,
  getFileProfitability,
  getClientProfitability,
  getActualCautionsReport,
} from '../controllers/financeController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const financeRouter = Router();
financeRouter.use(requireAuth);

financeRouter.get('/balance', asyncHandler(getBalance));
financeRouter.get('/files/:id/profitability', asyncHandler(getFileProfitability));
financeRouter.get('/clients/:id/profitability', asyncHandler(getClientProfitability));
financeRouter.get('/cautions/actual-paid', asyncHandler(getActualCautionsReport));
