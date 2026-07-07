import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { agentsRouter } from './routes/agents.js';
import { transportersRouter } from './routes/transporters.js';
import { paymentTypesRouter } from './routes/paymentTypes.js';
import { clientsRouter } from './routes/clients.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/agents', agentsRouter);
  app.use('/api/transporters', transportersRouter);
  app.use('/api/payment-types', paymentTypesRouter);
  app.use('/api/clients', clientsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
