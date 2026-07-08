import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log(`[db] connected to ${env.mongoUri}`);
}

/**
 * Drops indexes no longer declared on a schema and creates newly added
 * ones, for every model registered by the time this runs. Must be called
 * after all model modules have been imported (i.e. after the route tree
 * is built) — Mongoose can only sync indexes for models it knows about.
 * Without this, a schema index change (e.g. PaymentType's old flat
 * `name` unique index being replaced by a `category+name` compound one)
 * leaves the stale index in place and silently breaks writes that are
 * valid under the new schema.
 */
export async function syncAllIndexes() {
  for (const modelName of mongoose.modelNames()) {
    await mongoose.model(modelName).syncIndexes();
  }
  console.log('[db] indexes synced');
}
