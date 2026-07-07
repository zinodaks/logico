import { randomUUID } from 'crypto';
import archiver from 'archiver';
import { Client } from '../models/Client.js';
import { uploadObject, deleteObject, getPresignedDownloadUrl, getObjectStream } from '../services/s3Service.js';
import { buildClientStatementData } from '../services/statementService.js';
import { streamClientStatementPdf, streamClientStatementXlsx } from '../services/exportService.js';
import { ApiError } from '../middleware/errorHandler.js';

const CLIENT_FIELDS = ['name', 'address', 'rccm', 'identificationNationale', 'nif'];

export async function listClients(req, res) {
  const includeInactive = req.query.includeInactive === 'true';
  const filter = includeInactive ? {} : { active: true };
  const clients = await Client.find(filter).sort({ name: 1 });
  res.json({ items: clients });
}

export async function getClient(req, res) {
  const client = await Client.findById(req.params.id);
  if (!client) throw new ApiError(404, 'Client not found');
  res.json({ item: client });
}

export async function createClient(req, res) {
  const payload = {};
  for (const field of CLIENT_FIELDS) {
    if (req.body[field] !== undefined) payload[field] = req.body[field];
  }
  if (!payload.name || !payload.address) {
    throw new ApiError(400, 'name and address are required');
  }
  const client = await Client.create(payload);
  res.status(201).json({ item: client });
}

export async function updateClient(req, res) {
  const payload = {};
  for (const field of [...CLIENT_FIELDS, 'active']) {
    if (req.body[field] !== undefined) payload[field] = req.body[field];
  }
  const client = await Client.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!client) throw new ApiError(404, 'Client not found');
  res.json({ item: client });
}

export async function deleteClient(req, res) {
  const client = await Client.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!client) throw new ApiError(404, 'Client not found');
  res.json({ item: client });
}

export async function uploadDocument(req, res) {
  const client = await Client.findById(req.params.id);
  if (!client) throw new ApiError(404, 'Client not found');
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const key = `clients/${client._id}/${randomUUID()}-${req.file.originalname}`;
  await uploadObject(key, req.file.buffer, req.file.mimetype);

  client.documents.push({
    key,
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedBy: req.user._id,
  });
  await client.save();

  res.status(201).json({ item: client });
}

export async function deleteDocument(req, res) {
  const client = await Client.findById(req.params.id);
  if (!client) throw new ApiError(404, 'Client not found');

  const doc = client.documents.id(req.params.docId);
  if (!doc) throw new ApiError(404, 'Document not found');

  await deleteObject(doc.key);
  doc.deleteOne();
  await client.save();

  res.json({ item: client });
}

export async function downloadDocument(req, res) {
  const client = await Client.findById(req.params.id);
  if (!client) throw new ApiError(404, 'Client not found');

  const doc = client.documents.id(req.params.docId);
  if (!doc) throw new ApiError(404, 'Document not found');

  const url = await getPresignedDownloadUrl(doc.key, doc.filename);
  res.redirect(url);
}

export async function downloadAllDocuments(req, res) {
  const client = await Client.findById(req.params.id);
  if (!client) throw new ApiError(404, 'Client not found');
  if (client.documents.length === 0) throw new ApiError(404, 'This client has no documents');

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${client.name}-documents.zip"`);

  const archive = archiver('zip');
  archive.pipe(res);

  for (const doc of client.documents) {
    const stream = await getObjectStream(doc.key);
    archive.append(stream, { name: doc.filename });
  }

  await archive.finalize();
}

export async function getClientStatement(req, res) {
  const data = await buildClientStatementData(req.params.id);
  if (!data) throw new ApiError(404, 'Client not found');

  if (req.query.format === 'xlsx') {
    await streamClientStatementXlsx(res, data);
  } else {
    streamClientStatementPdf(res, data);
  }
}
