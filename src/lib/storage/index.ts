import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface StorageFile {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}

export interface StorageResult {
  fileUrl: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
}

export interface StorageProvider {
  saveFile(file: StorageFile): Promise<StorageResult>;
  getFile(fileKey: string): Promise<Buffer | null>;
  deleteFile(fileKey: string): Promise<boolean>;
  getUrl(fileKey: string): string;
}

export class LocalDiskStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
  }

  private async ensureDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  // Get safe extension from MIME or original filename
  private getExtension(mimeType: string, originalName: string): string {
    const ext = path.extname(originalName).toLowerCase().replace(".", "");
    if (ext && /^[a-z0-9]{2,5}$/.test(ext)) {
      return `.${ext}`;
    }

    switch (mimeType) {
      case "audio/mpeg":
      case "audio/mp3":
        return ".mp3";
      case "audio/wav":
      case "audio/x-wav":
        return ".wav";
      case "audio/ogg":
        return ".ogg";
      case "audio/webm":
        return ".webm";
      case "audio/aac":
        return ".aac";
      case "audio/flac":
        return ".flac";
      case "audio/mp4":
      case "audio/m4a":
      case "audio/x-m4a":
        return ".m4a";
      case "video/mp4":
        return ".mp4";
      case "video/webm":
        return ".webm";
      default:
        return ".bin";
    }
  }

  async saveFile(file: StorageFile): Promise<StorageResult> {
    await this.ensureDir();

    // Generate cryptographically random secure filename to prevent path traversal
    const randomId = crypto.randomUUID();
    const extension = this.getExtension(file.mimeType, file.originalName);
    const safeFilename = `${Date.now()}-${randomId}${extension}`;
    const filePath = path.join(this.uploadDir, safeFilename);

    await fs.writeFile(filePath, file.buffer);

    return {
      fileUrl: `/uploads/${safeFilename}`,
      fileKey: safeFilename,
      fileSize: file.buffer.length,
      mimeType: file.mimeType,
    };
  }

  async getFile(fileKey: string): Promise<Buffer | null> {
    // Sanitize fileKey to prevent directory traversal
    const sanitizedKey = path.basename(fileKey);
    const filePath = path.join(this.uploadDir, sanitizedKey);

    try {
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  async deleteFile(fileKey: string): Promise<boolean> {
    try {
      const sanitizedKey = path.basename(fileKey);
      const filePath = path.join(this.uploadDir, sanitizedKey);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(fileKey: string): string {
    const sanitizedKey = path.basename(fileKey);
    return `/uploads/${sanitizedKey}`;
  }
}

// Global storage provider singleton
export const storage: StorageProvider = new LocalDiskStorageProvider();
