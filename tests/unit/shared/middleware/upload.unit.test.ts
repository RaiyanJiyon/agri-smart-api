import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import { uploadCropImage } from '../../../../src/app/shared/middleware/upload.js';

describe('upload middleware', () => {
  it('should allow valid image types (JPEG, PNG, WebP)', () => {
    const mockReq = {} as Request;

    const testMimeType = (mimeType: string): boolean => {
      let isAllowed = false;

      const fileFilter = (
        uploadCropImage as unknown as {
          fileFilter: (
            req: Request,
            file: { mimetype: string },
            cb: (err: Error | null, accept?: boolean) => void
          ) => void;
        }
      ).fileFilter;

      fileFilter(mockReq, { mimetype: mimeType }, (_error, acceptFile) => {
        isAllowed = !!acceptFile;
      });

      return isAllowed;
    };

    expect(testMimeType('image/jpeg')).toBe(true);
    expect(testMimeType('image/png')).toBe(true);
    expect(testMimeType('image/webp')).toBe(true);
  });

  it('should reject invalid file types (e.g. PDF, GIF, text)', () => {
    const mockReq = {} as Request;
    let errMessage = '';

    const fileFilter = (
      uploadCropImage as unknown as {
        fileFilter: (
          req: Request,
          file: { mimetype: string },
          cb: (err: Error | null, accept?: boolean) => void
        ) => void;
      }
    ).fileFilter;

    fileFilter(mockReq, { mimetype: 'application/pdf' }, (error) => {
      if (error) {
        errMessage = error.message;
      }
    });

    expect(errMessage).toBe('Invalid image type. Only JPEG, PNG, and WebP images are allowed.');
  });
});
