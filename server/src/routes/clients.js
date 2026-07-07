import { Router } from 'express';
import multer from 'multer';
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  uploadDocument,
  deleteDocument,
  downloadDocument,
} from '../controllers/clientController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

export const clientsRouter = Router();
clientsRouter.use(requireAuth);

clientsRouter.get('/', asyncHandler(listClients));
clientsRouter.post('/', asyncHandler(createClient));
clientsRouter.get('/:id', asyncHandler(getClient));
clientsRouter.patch('/:id', asyncHandler(updateClient));
clientsRouter.delete('/:id', asyncHandler(deleteClient));

clientsRouter.post('/:id/documents', upload.single('file'), asyncHandler(uploadDocument));
clientsRouter.delete('/:id/documents/:docId', asyncHandler(deleteDocument));
clientsRouter.get('/:id/documents/:docId/download', asyncHandler(downloadDocument));
