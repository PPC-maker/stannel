// Image Processor Service - Enhance invoice photos for better AI recognition

import sharp from 'sharp';

export const imageProcessorService = {
  /**
   * Process an invoice image for better AI recognition:
   * 1. Auto-rotate based on EXIF data
   * 2. Enhance contrast and sharpness
   * 3. Normalize brightness
   * 4. Remove noise
   */
  async enhanceInvoiceImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const enhanced = await sharp(imageBuffer)
        // Auto-rotate based on EXIF orientation (phone camera rotation)
        .rotate()
        // Normalize brightness and contrast
        .normalize()
        // Sharpen text for better OCR/AI reading
        .sharpen({
          sigma: 1.5,
          m1: 1.0,
          m2: 0.5,
        })
        // Slight contrast boost
        .modulate({
          brightness: 1.05,
          saturation: 0.8, // Reduce color saturation to focus on text
        })
        // Convert to high quality JPEG
        .jpeg({
          quality: 92,
          mozjpeg: true,
        })
        .toBuffer();

      console.log(`[ImageProcessor] Enhanced image: ${imageBuffer.length} → ${enhanced.length} bytes`);
      return enhanced;
    } catch (error) {
      console.error('[ImageProcessor] Enhancement failed, using original:', error);
      return imageBuffer; // Return original if processing fails
    }
  },

  /**
   * Process image for maximum AI readability (grayscale + high contrast)
   * Used specifically for the AI analysis step
   */
  async prepareForAI(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const processed = await sharp(imageBuffer)
        .rotate()
        // Convert to grayscale for cleaner text recognition
        .grayscale()
        // High contrast normalization
        .normalize()
        // Strong sharpen for text
        .sharpen({
          sigma: 2.0,
          m1: 1.5,
          m2: 0.7,
        })
        // Increase contrast
        .linear(1.3, -20) // contrast multiplier, brightness offset
        .jpeg({
          quality: 95,
          mozjpeg: true,
        })
        .toBuffer();

      console.log(`[ImageProcessor] AI-optimized image: ${imageBuffer.length} → ${processed.length} bytes`);
      return processed;
    } catch (error) {
      console.error('[ImageProcessor] AI preparation failed, using original:', error);
      return imageBuffer;
    }
  },
};
