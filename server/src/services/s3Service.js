import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';

const client = new S3Client({
  endpoint: env.s3.endpoint,
  region: env.s3.region,
  forcePathStyle: env.s3.forcePathStyle,
  credentials: {
    accessKeyId: env.s3.accessKeyId,
    secretAccessKey: env.s3.secretAccessKey,
  },
});

export async function uploadObject(key, buffer, mimeType) {
  await client.send(
    new PutObjectCommand({
      Bucket: env.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }),
  );
}

export async function deleteObject(key) {
  await client.send(new DeleteObjectCommand({ Bucket: env.s3.bucket, Key: key }));
}

export async function getObjectStream(key) {
  const result = await client.send(
    new GetObjectCommand({ Bucket: env.s3.bucket, Key: key }),
  );
  return result.Body;
}

export async function getPresignedDownloadUrl(key, filename) {
  const command = new GetObjectCommand({
    Bucket: env.s3.bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });
  return getSignedUrl(client, command, { expiresIn: 300 });
}
