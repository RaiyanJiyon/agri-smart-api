import { cloudinary } from './cloudinary.config.js';
import type { StorageService, StorageUploadResult } from './storage.interface.js';

const uploadImage = async (file: Buffer, folder: string): Promise<StorageUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          let err: Error;
          if (error instanceof Error) {
            err = error;
          } else if (
            error &&
            typeof error === 'object' &&
            'message' in error &&
            typeof error.message === 'string'
          ) {
            err = new Error(error.message);
          } else {
            err = new Error('Cloudinary image upload failed.');
          }

          reject(err);
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(file);
  });
};

const deleteImage = async (publicId: string): Promise<void> => {
  const result = (await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  })) as { result?: string };

  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error('Failed to delete image from Cloudinary.');
  }
};

export const CloudinaryService: StorageService = {
  uploadImage,
  deleteImage,
};
