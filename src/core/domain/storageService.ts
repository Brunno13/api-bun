export interface StorageService {
  upload(file: File): Promise<string>;
  getFile(fileName: string): Promise<{ buffer: Buffer; contentType: string }>;
}