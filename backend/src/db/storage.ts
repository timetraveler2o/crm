import "dotenv/config";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  forcePathStyle: true,
  region: process.env.AWS_REGION || "us-east-2",
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
});

export const DEFAULT_BUCKET = process.env.AWS_BUCKET || "assets";

/**
 * Upload an object / file buffer to Neon Object Storage
 */
export async function uploadObject(
  key: string,
  body: string | Uint8Array | Buffer,
  contentType: string = "text/plain",
  bucket: string = DEFAULT_BUCKET
) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    const result = await s3.send(command);
    console.log(`[Neon Object Storage] Uploaded ${key} to ${bucket}`);
    return { success: true, result };
  } catch (err: any) {
    console.warn(`[Neon Object Storage Warning]: Failed to upload ${key}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Generate a presigned view/download URL for an object
 */
export async function getPresignedViewUrl(
  key: string,
  bucket: string = DEFAULT_BUCKET,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(s3, command, { expiresIn });
    return url;
  } catch (err: any) {
    console.warn(`[Neon Object Storage Warning]: Failed to generate presigned URL for ${key}:`, err.message);
    return null;
  }
}
