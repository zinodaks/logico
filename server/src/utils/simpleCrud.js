import { ApiError } from '../middleware/errorHandler.js';

/**
 * Builds list/create/update/remove controllers for simple flat resources
 * (Agent, Transporter, PaymentType) that share the same active-flag /
 * soft-delete shape. Client and File have enough extra behavior (documents,
 * snapshots) to stay hand-written.
 */
export function buildSimpleCrudController(Model, fields, filterFields = []) {
  return {
    async list(req, res) {
      const includeInactive = req.query.includeInactive === 'true';
      const filter = includeInactive ? {} : { active: true };
      for (const field of filterFields) {
        if (req.query[field] !== undefined) filter[field] = req.query[field];
      }
      const docs = await Model.find(filter).sort({ name: 1 });
      res.json({ items: docs });
    },

    async getOne(req, res) {
      const doc = await Model.findById(req.params.id);
      if (!doc) throw new ApiError(404, 'Not found');
      res.json({ item: doc });
    },

    async create(req, res) {
      const payload = {};
      for (const field of fields) {
        if (req.body[field] !== undefined) payload[field] = req.body[field];
      }
      const doc = await Model.create(payload);
      res.status(201).json({ item: doc });
    },

    async update(req, res) {
      const payload = {};
      for (const field of [...fields, 'active']) {
        if (req.body[field] !== undefined) payload[field] = req.body[field];
      }
      const doc = await Model.findByIdAndUpdate(req.params.id, payload, { new: true });
      if (!doc) throw new ApiError(404, 'Not found');
      res.json({ item: doc });
    },

    async remove(req, res) {
      const doc = await Model.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
      if (!doc) throw new ApiError(404, 'Not found');
      res.json({ item: doc });
    },
  };
}
