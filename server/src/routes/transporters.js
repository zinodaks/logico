import { Router } from 'express';
import { Transporter } from '../models/Transporter.js';
import { buildSimpleCrudController } from '../utils/simpleCrud.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../middleware/errorHandler.js';
import { buildTransporterStatementData } from '../services/statementService.js';
import {
  streamTransporterStatementPdf,
  streamTransporterStatementXlsx,
} from '../services/exportService.js';

const controller = buildSimpleCrudController(Transporter, ['name', 'fixedTransportCost', 'currency']);

export const transportersRouter = Router();
transportersRouter.use(requireAuth);
transportersRouter.get('/', asyncHandler(controller.list));
transportersRouter.post('/', asyncHandler(controller.create));
transportersRouter.get('/:id', asyncHandler(controller.getOne));
transportersRouter.patch('/:id', asyncHandler(controller.update));
transportersRouter.delete('/:id', asyncHandler(controller.remove));

transportersRouter.get(
  '/:id/statement',
  asyncHandler(async (req, res) => {
    const data = await buildTransporterStatementData(req.params.id);
    if (!data) throw new ApiError(404, 'Transporter not found');

    if (req.query.format === 'json') {
      res.json(data);
    } else if (req.query.format === 'xlsx') {
      await streamTransporterStatementXlsx(res, data);
    } else {
      streamTransporterStatementPdf(res, data);
    }
  }),
);
