import { Router } from 'express';
import { Agent } from '../models/Agent.js';
import { buildSimpleCrudController } from '../utils/simpleCrud.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const controller = buildSimpleCrudController(Agent, ['name']);

export const agentsRouter = Router();
agentsRouter.use(requireAuth);
agentsRouter.get('/', asyncHandler(controller.list));
agentsRouter.post('/', asyncHandler(controller.create));
agentsRouter.patch('/:id', asyncHandler(controller.update));
agentsRouter.delete('/:id', asyncHandler(controller.remove));
