/**
 * Filesystem storage for documents
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Document } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class FileSystemStorage {
  private storageDir: string;

  constructor(storageDir: string) {
    this.storageDir = storageDir;
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      logger.info(`Filesystem storage initialized at: ${this.storageDir}`);
    } catch (error: any) {
      logger.error(`Failed to initialize filesystem storage: ${error.message}`);
      throw new Error(`Filesystem storage initialization failed: ${error.message}`);
    }
  }

  async saveDocument(document: Document): Promise<void> {
    try {
      const docPath = this.getDocumentPath(document.id);
      const docData = JSON.stringify(document, null, 2);
      await fs.writeFile(docPath, docData, 'utf-8');
      logger.debug(`Saved document ${document.id} to filesystem`);
    } catch (error: any) {
      logger.error(`Failed to save document: ${error.message}`);
      throw new Error(`Document save failed: ${error.message}`);
    }
  }

  async loadDocument(documentId: string): Promise<Document | null> {
    try {
      const docPath = this.getDocumentPath(documentId);
      const docData = await fs.readFile(docPath, 'utf-8');
      const document = JSON.parse(docData);
      
      // Convert date strings back to Date objects
      document.createdAt = new Date(document.createdAt);
      document.updatedAt = new Date(document.updatedAt);
      
      logger.debug(`Loaded document ${documentId} from filesystem`);
      return document;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      logger.error(`Failed to load document: ${error.message}`);
      throw new Error(`Document load failed: ${error.message}`);
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      const docPath = this.getDocumentPath(documentId);
      await fs.unlink(docPath);
      logger.debug(`Deleted document ${documentId} from filesystem`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        logger.error(`Failed to delete document: ${error.message}`);
        throw new Error(`Document deletion failed: ${error.message}`);
      }
    }
  }

  async listDocuments(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.storageDir);
      const docIds = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
      return docIds;
    } catch (error: any) {
      logger.error(`Failed to list documents: ${error.message}`);
      throw new Error(`Document listing failed: ${error.message}`);
    }
  }

  async updateDocument(document: Document): Promise<void> {
    document.updatedAt = new Date();
    await this.saveDocument(document);
  }

  private getDocumentPath(documentId: string): string {
    return path.join(this.storageDir, `${documentId}.json`);
  }

  async copyOriginalFile(sourcePath: string, documentId: string): Promise<string> {
    try {
      const ext = path.extname(sourcePath);
      const destPath = path.join(this.storageDir, `${documentId}_original${ext}`);
      await fs.copyFile(sourcePath, destPath);
      logger.debug(`Copied original file to ${destPath}`);
      return destPath;
    } catch (error: any) {
      logger.error(`Failed to copy original file: ${error.message}`);
      throw new Error(`File copy failed: ${error.message}`);
    }
  }
}

