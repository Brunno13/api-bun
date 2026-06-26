import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import type { StorageService } from "../../core/domain/storageService";
import { MESSAGES, ErrorCode } from "../../core/messages/messages"; // 🔥 Import centralizado
import { AppError } from "../../core/errors/appError";

const envSchema = z.object({
  GARAGE_S3_ENDPOINT: z.string().url(),
  GARAGE_S3_ACCESS_KEY_ID: z.string().min(1),
  GARAGE_S3_SECRET_ACCESS_KEY: z.string().min(1),
  GARAGE_S3_BUCKET_NAME: z.string().min(1),
  GARAGE_S3_PUBLIC_URL: z.string().url(),
});

const S3_REGION = "us-east-1"; 

export class GarageStorageService implements StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const env = envSchema.parse({
      GARAGE_S3_ENDPOINT: process.env.GARAGE_S3_ENDPOINT,
      GARAGE_S3_ACCESS_KEY_ID: process.env.GARAGE_S3_ACCESS_KEY_ID,
      GARAGE_S3_SECRET_ACCESS_KEY: process.env.GARAGE_S3_SECRET_ACCESS_KEY,
      GARAGE_S3_BUCKET_NAME: process.env.GARAGE_S3_BUCKET_NAME,
      GARAGE_S3_PUBLIC_URL: process.env.GARAGE_S3_PUBLIC_URL,
    });

    this.bucketName = env.GARAGE_S3_BUCKET_NAME;
    this.publicUrl = env.GARAGE_S3_PUBLIC_URL.replace(/\/+$/, "");

    this.s3Client = new S3Client({
      region: S3_REGION,
      endpoint: env.GARAGE_S3_ENDPOINT,
      credentials: {
        accessKeyId: env.GARAGE_S3_ACCESS_KEY_ID,
        secretAccessKey: env.GARAGE_S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
  }

  async upload(file: File): Promise<string> {
    try {
      const extension = file.name.split(".").pop() || "jpg";
      const uniqueFileName = `${crypto.randomUUID()}.${extension}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueFileName,
        Body: buffer,
        ContentType: file.type,
      });

      await this.s3Client.send(command);

      return `${this.publicUrl}/${this.bucketName}/${uniqueFileName}`;
    } catch (error) {
      throw new AppError(ErrorCode.UPLOAD_FAILED);
    }
  }
}