import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint = process.env.R2_ENDPOINT;
const bucket = process.env.R2_BUCKET;

const client = endpoint && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
  ? new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

export function isR2Configured(): boolean {
  return Boolean(client && bucket);
}

function requireR2(): { client: S3Client; bucket: string } {
  if (!client || !bucket) {
    throw new Error('R2 yapılandırması eksik: R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID ve R2_SECRET_ACCESS_KEY gerekli');
  }
  return { client, bucket };
}

export async function putPhoto(
  objectKey: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const r2 = requireR2();
  await r2.client.send(new PutObjectCommand({
    Bucket: r2.bucket,
    Key: objectKey,
    Body: body,
    ContentType: contentType,
    CacheControl: 'private, max-age=31536000, immutable',
  }));
}

export async function headPhoto(objectKey: string): Promise<{ sizeBytes: number; contentType?: string }> {
  const r2 = requireR2();
  const result = await r2.client.send(new HeadObjectCommand({ Bucket: r2.bucket, Key: objectKey }));
  return {
    sizeBytes: result.ContentLength ?? 0,
    contentType: result.ContentType,
  };
}

export async function createPhotoReadUrl(objectKey: string, expiresInSeconds = 900): Promise<string> {
  const r2 = requireR2();
  return getSignedUrl(
    r2.client,
    new GetObjectCommand({ Bucket: r2.bucket, Key: objectKey }),
    { expiresIn: expiresInSeconds }
  );
}


