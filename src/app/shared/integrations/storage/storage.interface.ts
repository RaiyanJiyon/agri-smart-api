export interface StorageUploadResult {
  url: string;
  publicId?: string;
}

export interface StorageService {
  uploadImage(file: Buffer, folder: string): Promise<StorageUploadResult>;

  deleteImage(publicId: string): Promise<void>;
}
