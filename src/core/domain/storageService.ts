export interface StorageService {
  upload(file: File): Promise<string>;
}