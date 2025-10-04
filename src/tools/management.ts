/**
 * Document management tools
 */

import { StorageBackend } from '../types/index.js';
import { validateDocumentId, validateMetadata, validateTags } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

export class ManagementTool {
  constructor(private storage: StorageBackend) {}

  async listDocuments(args: {
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{
    documents: Array<{
      id: string;
      filename: string;
      file_type: string;
      tags: string[];
      chunks_count: number;
      created_at: string;
      updated_at: string;
    }>;
    total: number;
  }> {
    try {
      const documents = await this.storage.listDocuments({
        tags: args.tags,
        limit: args.limit || 50,
        offset: args.offset || 0,
      });

      const formattedDocs = documents.map(doc => ({
        id: doc.id,
        filename: doc.metadata.filename || 'Unknown',
        file_type: doc.metadata.fileType,
        tags: doc.metadata.tags,
        chunks_count: doc.chunks.length,
        created_at: doc.createdAt.toISOString(),
        updated_at: doc.updatedAt.toISOString(),
      }));

      logger.info(`Listed ${formattedDocs.length} documents`);

      return {
        documents: formattedDocs,
        total: formattedDocs.length,
      };
    } catch (error: any) {
      logger.error(`Failed to list documents: ${error.message}`);
      throw new Error(`Document listing failed: ${error.message}`);
    }
  }

  async getDocument(args: { document_id: string }): Promise<{
    id: string;
    content: string;
    filename: string;
    file_type: string;
    tags: string[];
    chunks: Array<{
      index: number;
      content: string;
      start_char: number;
      end_char: number;
    }>;
    created_at: string;
    updated_at: string;
  }> {
    try {
      validateDocumentId(args.document_id);

      const document = await this.storage.getDocument(args.document_id);
      
      if (!document) {
        throw new Error(`Document not found: ${args.document_id}`);
      }

      logger.info(`Retrieved document ${args.document_id}`);

      return {
        id: document.id,
        content: document.content,
        filename: document.metadata.filename || 'Unknown',
        file_type: document.metadata.fileType,
        tags: document.metadata.tags,
        chunks: document.chunks.map(chunk => ({
          index: chunk.index,
          content: chunk.content,
          start_char: chunk.metadata.startChar,
          end_char: chunk.metadata.endChar,
        })),
        created_at: document.createdAt.toISOString(),
        updated_at: document.updatedAt.toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get document: ${error.message}`);
      throw new Error(`Document retrieval failed: ${error.message}`);
    }
  }

  async deleteDocument(args: { document_id: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      validateDocumentId(args.document_id);

      // Check if document exists
      const document = await this.storage.getDocument(args.document_id);
      if (!document) {
        throw new Error(`Document not found: ${args.document_id}`);
      }

      await this.storage.deleteDocument(args.document_id);

      logger.info(`Deleted document ${args.document_id}`);

      return {
        success: true,
        message: `Document ${args.document_id} deleted successfully`,
      };
    } catch (error: any) {
      logger.error(`Failed to delete document: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async updateDocumentMetadata(args: {
    document_id: string;
    metadata?: Record<string, any>;
    tags?: string[];
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      validateDocumentId(args.document_id);

      // Validate inputs
      if (args.metadata) {
        validateMetadata(args.metadata);
      }

      const tags = args.tags ? validateTags(args.tags) : undefined;

      // Check if document exists
      const document = await this.storage.getDocument(args.document_id);
      if (!document) {
        throw new Error(`Document not found: ${args.document_id}`);
      }

      // Update metadata
      const updates: any = {};
      if (args.metadata) {
        updates.customMetadata = { ...document.metadata.customMetadata, ...args.metadata };
      }
      if (tags) {
        updates.tags = tags;
      }

      await this.storage.updateDocumentMetadata(args.document_id, updates);

      logger.info(`Updated metadata for document ${args.document_id}`);

      return {
        success: true,
        message: `Document metadata updated successfully`,
      };
    } catch (error: any) {
      logger.error(`Failed to update document metadata: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getCollectionStats(): Promise<{
    total_documents: number;
    total_chunks: number;
    collection_size: number;
    average_chunks_per_document: number;
    file_types: Record<string, number>;
  }> {
    try {
      const stats = await this.storage.getStats();

      logger.info(`Retrieved collection stats`);

      return {
        total_documents: stats.totalDocuments,
        total_chunks: stats.totalChunks,
        collection_size: stats.collectionSize,
        average_chunks_per_document: Math.round(stats.averageChunksPerDocument * 100) / 100,
        file_types: stats.fileTypes,
      };
    } catch (error: any) {
      logger.error(`Failed to get collection stats: ${error.message}`);
      throw new Error(`Stats retrieval failed: ${error.message}`);
    }
  }
}

