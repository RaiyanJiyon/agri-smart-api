import multer from 'multer';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.memoryStorage();

export const fileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    callback(new Error('Invalid image type. Only JPEG, PNG, and WebP images are allowed.'));
    return;
  }

  callback(null, true);
};

export const uploadCropImage = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
  fileFilter,
});
