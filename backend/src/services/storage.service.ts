// Storage Service - Google Cloud Storage

import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';

const storage = new Storage();
const INVOICE_BUCKET = process.env.GCS_INVOICE_BUCKET || 'stannel-invoices';
const ASSETS_BUCKET = process.env.GCS_ASSETS_BUCKET || 'stannel-assets';

export const storageService = {
  async uploadInvoice(buffer: Buffer, originalFilename: string): Promise<string> {
    const bucket = storage.bucket(INVOICE_BUCKET);
    const extension = originalFilename.split('.').pop() || 'jpg';
    const filename = `invoices/${Date.now()}-${randomUUID()}.${extension}`;

    const file = bucket.file(filename);
    await file.save(buffer, {
      metadata: {
        contentType: this.getContentType(extension),
      },
    });

    return `https://storage.googleapis.com/${INVOICE_BUCKET}/${filename}`;
  },

  async uploadAsset(buffer: Buffer, path: string, filename: string): Promise<string> {
    const bucket = storage.bucket(ASSETS_BUCKET);
    const fullPath = `${path}/${filename}`;

    const file = bucket.file(fullPath);
    await file.save(buffer, {
      metadata: {
        contentType: this.getContentType(filename.split('.').pop() || ''),
        cacheControl: 'public, max-age=31536000',
      },
      public: true,
    });

    return `https://storage.googleapis.com/${ASSETS_BUCKET}/${fullPath}`;
  },

  async getSignedUrl(bucket: string, filename: string, expiresInMinutes = 60): Promise<string> {
    const file = storage.bucket(bucket).file(filename);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });
    return url;
  },

  async deleteFile(bucket: string, filename: string): Promise<void> {
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
