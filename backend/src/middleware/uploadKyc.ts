import multer from 'multer';
import { getMaxFileSize, getAllowedTypes } from '../config/storage.js';

const storage = multer.memoryStorage();

export const uploadKycMulter = multer({
  storage,
  limits: { fileSize: getMaxFileSize() },
  fileFilter: (_req, file, cb) => {
    if (getAllowedTypes().includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
}).single('file');
