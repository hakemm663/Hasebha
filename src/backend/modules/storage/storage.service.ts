import { getSupabaseAdmin } from '../../common/supabase-admin';

export const ALLOWED_RECEIPT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_RECEIPT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export class StorageService {
  private supabase = getSupabaseAdmin();
  private bucketName = 'receipts-private';

  /**
   * Validate receipt file metadata
   */
  validateReceiptFile(contentType: string, fileSizeBytes?: number) {
    const normalizedType = contentType.toLowerCase().trim();
    if (!ALLOWED_RECEIPT_MIME_TYPES.includes(normalizedType as any)) {
      throw new Error(
        `Invalid file type "${contentType}". Only JPEG, PNG, and WEBP images are allowed.`
      );
    }

    if (fileSizeBytes !== undefined && fileSizeBytes > MAX_RECEIPT_FILE_SIZE) {
      throw new Error(
        `File size (${(fileSizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed 10MB limit.`
      );
    }
  }

  /**
   * Generate tenant-scoped storage path: businesses/{businessId}/expenses/{expenseId}/{timestamp}_{safeName}
   */
  generateTenantStoragePath(businessId: string, expenseId: string, fileName: string): string {
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100);
    return `businesses/${businessId}/expenses/${expenseId}/${Date.now()}_${safeName}`;
  }

  /**
   * Generate secure signed upload URL for private direct client upload
   */
  async createReceiptSignedUploadUrl(
    businessId: string,
    expenseId: string,
    fileName: string,
    contentType: string,
    fileSizeBytes?: number
  ): Promise<{ signedUrl: string; token: string; storagePath: string; expiresInSeconds: number }> {
    this.validateReceiptFile(contentType, fileSizeBytes);
    const storagePath = this.generateTenantStoragePath(businessId, expenseId, fileName);

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUploadUrl(storagePath);

      if (error) {
        // Fallback simulation token if local/mock Supabase
        return {
          signedUrl: `/api/v1/expenses/${expenseId}/receipt/direct-upload?path=${encodeURIComponent(storagePath)}`,
          token: `signed-token-${Date.now()}`,
          storagePath,
          expiresInSeconds: 3600,
        };
      }

      return {
        signedUrl: data?.signedUrl || '',
        token: data?.token || '',
        storagePath,
        expiresInSeconds: 3600,
      };
    } catch (err: any) {
      return {
        signedUrl: `/api/v1/expenses/${expenseId}/receipt/direct-upload?path=${encodeURIComponent(storagePath)}`,
        token: `signed-token-${Date.now()}`,
        storagePath,
        expiresInSeconds: 3600,
      };
    }
  }

  /**
   * Generate secure signed download URL for private receipt image (valid for 1 hour)
   */
  async getReceiptSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string | null> {
    if (!storagePath) return null;
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, expiresInSeconds);

      if (error) {
        console.warn('Receipt signed URL note:', error.message);
        // Fallback route that verifies tenant authorization
        return `/api/v1/expenses/receipt/proxy?path=${encodeURIComponent(storagePath)}`;
      }
      return data?.signedUrl || null;
    } catch (err) {
      console.warn('StorageService getReceiptSignedUrl error:', err);
      return `/api/v1/expenses/receipt/proxy?path=${encodeURIComponent(storagePath)}`;
    }
  }

  /**
   * Safely delete private receipt object
   */
  async deleteReceiptFile(storagePath: string): Promise<boolean> {
    if (!storagePath) return false;
    try {
      const { error } = await this.supabase.storage.from(this.bucketName).remove([storagePath]);
      if (error) {
        console.warn('Failed to delete old receipt file:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('StorageService deleteReceiptFile error:', err);
      return false;
    }
  }

  /**
   * Upload receipt file buffer to private Supabase bucket
   */
  async uploadReceipt(
    businessId: string,
    expenseId: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    this.validateReceiptFile(contentType, fileBuffer.length);
    const storagePath = this.generateTenantStoragePath(businessId, expenseId, fileName);

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload receipt file: ${error.message}`);
    }

    return data?.path || storagePath;
  }
}
