import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

const R2_PUBLIC_URL = "https://images.phos.studio";

function getS3Client(): S3Client {
  const cached = (globalThis as Record<string, unknown>).__r2Client as S3Client | undefined;
  if (cached) return cached;

  const client = new S3Client({
    region: "auto",
    endpoint: requireEnv("R2_S3_ENDPOINT"),
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  (globalThis as Record<string, unknown>).__r2Client = client;
  return client;
}

/** R2 오브젝트의 공개 URL을 반환한다 */
export function getR2PublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

/** Buffer를 R2에 업로드하고 공개 URL을 반환한다 */
export async function uploadToR2(
  buffer: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<string> {
  const s3 = getS3Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: requireEnv("R2_BUCKET_NAME"),
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return getR2PublicUrl(key);
}

/** R2에서 오브젝트를 삭제한다 */
export async function deleteFromR2(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const s3 = getS3Client();
  const bucket = requireEnv("R2_BUCKET_NAME");

  if (keys.length === 1) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: keys[0] }));
    return;
  }

  await s3.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    })
  );
}

/** presigned PUT URL을 생성한다 (클라이언트 직접 업로드용) */
export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 600
): Promise<string> {
  const s3 = getS3Client();
  const command = new PutObjectCommand({
    Bucket: requireEnv("R2_BUCKET_NAME"),
    Key: key,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });
  return getSignedUrl(s3, command, { expiresIn });
}
