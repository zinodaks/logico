import { ProcessTemplate } from '../models/ProcessTemplate.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function getTemplate(req, res) {
  const { type } = req.params;
  if (!['IM4', 'TR8'].includes(type)) throw new ApiError(400, 'Invalid process type');

  let template = await ProcessTemplate.findOne({ processType: type });
  if (!template) {
    template = await ProcessTemplate.create({ processType: type, steps: [] });
  }
  res.json({ item: template });
}

export async function putTemplate(req, res) {
  const { type } = req.params;
  if (!['IM4', 'TR8'].includes(type)) throw new ApiError(400, 'Invalid process type');

  const steps = req.body.steps;
  if (!Array.isArray(steps)) throw new ApiError(400, 'steps must be an array');

  const normalizedSteps = steps.map((step, index) => ({ name: step.name, order: index }));

  const template = await ProcessTemplate.findOneAndUpdate(
    { processType: type },
    { steps: normalizedSteps },
    { new: true, upsert: true },
  );
  res.json({ item: template });
}
