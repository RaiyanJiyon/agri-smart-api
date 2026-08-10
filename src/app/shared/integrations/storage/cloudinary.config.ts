import { v2 as cloudinary } from 'cloudinary';
import { config } from '../../config/env.js';

cloudinary.config({
  cloud_name: config.STORAGE.CLOUDINARY_CLOUD_NAME,
  api_key: config.STORAGE.CLOUDINARY_API_KEY,
  api_secret: config.STORAGE.CLOUDINARY_API_SECRET,
});

export { cloudinary };
