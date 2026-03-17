/**
 * KYC document storage. Set CLOUDINARY_URL or use local uploads dir.
 * For Cloudinary/S3, wire your SDK here and return the public URL.
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UPLOAD_DIR = process.env.KYC_UPLOAD_DIR || path.join(__dirname, '../../uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export function getAllowedTypes(): string[] {
  return [...ALLOWED_TYPES];
}

export function getMaxFileSize(): number {
  return MAX_FILE_SIZE;
}

export async function saveKycDocument(
  buffer: Buffer,
  userId: string,
  mimeType: string
): Promise<{ url: string }> {
  const ext = mimeType === 'application/pdf' ? 'pdf' : mimeType.split('/')[1] || 'bin';
  const dir = path.join(UPLOAD_DIR, 'kyc');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filename = `${userId}_${Date.now()}.${ext}`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, buffer);
  const url = `/uploads/kyc/${filename}`;
  return { url };
}
