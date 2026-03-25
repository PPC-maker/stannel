// Storage Service - Google Cloud Storage with local fallback for development

import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const INVOICE_BUCKET = process.env.GCS_INVOICE_BUCKET || 'stannel-invoices';
const ASSETS_BUCKET = process.env.GCS_ASSETS_BUCKET || 'stannel-invoices'; // Use same bucket for assets

// Check if we have GCS credentials
const USE_LOCAL_STORAGE = process.env.NODE_ENV === 'development' && !process.env.GOOGLE_APPLICATION_CREDENTIALS;
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Initialize GCS only if we have credentials
let storage: Storage | null = null;
if (!USE_LOCAL_STORAGE) {
  try {
    storage = new Storage();
  } catch (error) {
    console.warn('[Storage] Failed to initialize GCS, falling back to local storage');
  }
}

// Ensure local upload directory exists
if (USE_LOCAL_STORAGE) {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
  if (!fs.existsSync(path.join(LOCAL_UPLOAD_DIR, 'invoices'))) {
    fs.mkdirSync(path.join(LOCAL_UPLOAD_DIR, 'invoices'), { recursive: true });
  }
  if (!fs.existsSync(path.join(LOCAL_UPLOAD_DIR, 'assets'))) {
    fs.mkdirSync(path.join(LOCAL_UPLOAD_DIR, 'assets'), { recursive: true });
  }
  console.log('[Storage] Using local file storage for development');
}

export const storageService = {
  async uploadInvoice(buffer: Buffer, originalFilename: string): Promise<string> {
    const extension = originalFilename.split('.').pop() || 'jpg';
    const filename = `invoices/${Date.now()}-${randomUUID()}.${extension}`;

    if (USE_LOCAL_STORAGE || !storage) {
      // Save locally for development
      const localPath = path.join(LOCAL_UPLOAD_DIR, filename);
      fs.writeFileSync(localPath, buffer);
      // Return a local URL that can be served by the backend
      const port = process.env.PORT || 8080;
      return `http://localhost:${port}/uploads/${filename}`;
    }

    // Use GCS in production
    const bucket = storage.bucket(INVOICE_BUCKET);
    const file = bucket.file(filename);
    await file.save(buffer, {
      metadata: {
        contentType: this.getContentType(extension),
      },
    });

    return `https://storage.googleapis.com/${INVOICE_BUCKET}/${filename}`;
  },

  async uploadPaymentProof(buffer: Buffer, originalFilename: string): Promise<string> {
    const extension = originalFilename.split('.').pop() || 'pdf';
    const filename = `payment-proofs/${Date.now()}-${randomUUID()}.${extension}`;

    if (USE_LOCAL_STORAGE || !storage) {
      // Save locally for development
      const localDir = path.join(LOCAL_UPLOAD_DIR, 'payment-proofs');
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      const localPath = path.join(LOCAL_UPLOAD_DIR, filename);
      fs.writeFileSync(localPath, buffer);
      const port = process.env.PORT || 8080;
      return `http://localhost:${port}/uploads/${filename}`;
    }

    // Use GCS in production
    const bucket = storage.bucket(INVOICE_BUCKET); // Store in same bucket as invoices
    const file = bucket.file(filename);
    await file.save(buffer, {
      metadata: {
        contentType: this.getContentType(extension),
      },
    });

    return `https://storage.googleapis.com/${INVOICE_BUCKET}/${filename}`;
  },

  async uploadAsset(buffer: Buffer, assetPath: string, filename: string): Promise<string> {
    const fullPath = `${assetPath}/${filename}`;

    if (USE_LOCAL_STORAGE || !storage) {
      // Save locally for development
      const localDir = path.join(LOCAL_UPLOAD_DIR, 'assets', assetPath);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      const localPath = path.join(localDir, filename);
      fs.writeFileSync(localPath, buffer);
      const port = process.env.PORT || 8080;
      return `http://localhost:${port}/uploads/assets/${fullPath}`;
    }

    // Use GCS in production - upload to invoices bucket with public access
    const bucket = storage.bucket(INVOICE_BUCKET);
    const file = bucket.file(`assets/${fullPath}`);
    await file.save(buffer, {
      metadata: {
        contentType: this.getContentType(filename.split('.').pop() || ''),
        cacheControl: 'public, max-age=31536000',
      },
      public: true,
    });

    // Return direct public URL
    return `https://storage.googleapis.com/${INVOICE_BUCKET}/assets/${fullPath}`;
  },

  async getSignedUrl(bucket: string, filename: string, expiresInMinutes = 60): Promise<string> {
    if (USE_LOCAL_STORAGE || !storage) {
      // For local development, just return the direct URL
      const port = process.env.PORT || 8080;
      return `http://localhost:${port}/uploads/${filename}`;
    }

    const file = storage.bucket(bucket).file(filename);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });
    return url;
  },

  async deleteFile(bucket: string, filename: string): Promise<void> {
    if (USE_LOCAL_STORAGE || !storage) {
      const localPath = path.join(LOCAL_UPLOAD_DIR, filename);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      return;
    }

    await storage.bucket(bucket).file(filename).delete();
  },

  getContentType(extension: string): string {
    const types: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
    };
    return types[extension.toLowerCase()] || 'application/octet-stream';
  },
};
