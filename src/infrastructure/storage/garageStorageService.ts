import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { StorageService } from "../../core/domain/storageService";

export class GarageStorageService implements StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    this.bucketName = process.env.GARAGE_S3_BUCKET_NAME!;
    this.publicUrl = process.env.GARAGE_S3_PUBLIC_URL!;

    this.s3Client = new S3Client({
      region: "us-east-1", // O Garage exige, mas ignora internamente
      endpoint: process.env.GARAGE_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.GARAGE_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.GARAGE_S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true, // Essencial para S3 autohospedado
    });
  }

  async upload(file: File): Promise<string> {
    // 1. Gera um nome único criptográfico para evitar colisões
    const extension = file.name.split(".").pop() || "jpg";
    const uniqueFileName = `${crypto.randomUUID()}.${extension}`;

    // 2. Transforma o arquivo em Buffer para envio
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Executa o comando de upload
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: file.type,
    });

    await this.s3Client.send(command);

    // 4. Retorna o caminho de leitura pública (porta 3902 do Garage S3 Web)
    return `${this.publicUrl}/${this.bucketName}/${uniqueFileName}`;
  }
}