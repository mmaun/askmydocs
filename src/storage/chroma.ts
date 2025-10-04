/**
 * Simple file-based storage backend for vector embeddings and search
 * No external database required - stores everything in JSON files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  Document,
  DocumentChunk,
  SearchResult,
  SearchOptions,
  CollectionStats,
  DocumentMetadata,
  StorageBackend,
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import { FileSystemStorage } from './filesystem.js';

interface VectorIndex {
  [chunkId: string]: {
    embedding: number[];
    documentId: string;
    chunkIndex: number;
  };
}

export class ChromaStorage implements StorageBackend {
  private fileStorage: FileSystemStorage;
  private indexPath: string;
  private vectorIndex: VectorIndex = {};

  constructor(chromaDbPath: string, storageDir: string) {
    this.fileStorage = new FileSystemStorage(storageDir);
    this.indexPath = path.join(storageDir, 'vector_index.json');
  }

  async initialize(): Promise<void> {
    try {
      await this.fileStorage.initialize();
      
      // Load existing vector index if it exists
      try {
        const indexData = await fs.readFile(this.indexPath, 'utf-8');
        this.vectorIndex = JSON.parse(indexData);
        logger.info(`Loaded vector index with ${Object.keys(this.vectorIndex).length} entries`);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          logger.info('Creating new vector index');
          this.vectorIndex = {};
          await this.saveIndex();
        } else {
          throw error;
        }
      }
      
      logger.info('Storage backend initialized successfully');
    } catch (error: any) {
      logger.error(`Failed to initialize storage: ${error.message}`);
      throw new Error(`Storage initialization failed: ${error.message}`);
    }
  }

  private async saveIndex(): Promise<void> {
    await fs.writeFile(this.indexPath, JSON.stringify(this.vectorIndex, null, 2), 'utf-8');
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async storeDocument(document: Document): Promise<void> {
    try {
      // Store document metadata in filesystem
      await this.fileStorage.saveDocument(document);

      // Store chunk embeddings in vector index
      if (document.chunks.length > 0) {
        for (const chunk of document.chunks) {
          const chunkId = `${document.id}_chunk_${chunk.index}`;
          this.vectorIndex[chunkId] = {
            embedding: chunk.embedding!,
            documentId: document.id,
            chunkIndex: chunk.index,
          };
        }
        
        await this.saveIndex();
        logger.info(`Stored document ${document.id} with ${document.chunks.length} chunks`);
      }
    } catch (error: any) {
      logger.error(`Failed to store document: ${error.message}`);
      throw new Error(`Document storage failed: ${error.message}`);
    }
  }

  async getDocument(documentId: string): Promise<Document | null> {
    return await this.fileStorage.loadDocument(documentId);
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Delete from filesystem
      await this.fileStorage.deleteDocument(documentId);

      // Delete chunks from vector index
      const keysToDelete = Object.keys(this.vectorIndex).filter(key => 
        this.vectorIndex[key].documentId === documentId
      );
      
      for (const key of keysToDelete) {
        delete this.vectorIndex[key];
      }
      
      if (keysToDelete.length > 0) {
        await this.saveIndex();
      }

      logger.info(`Deleted document ${documentId} from storage`);
    } catch (error: any) {
      logger.error(`Failed to delete document: ${error.message}`);
      throw new Error(`Document deletion failed: ${error.message}`);
    }
  }

  async updateDocumentMetadata(
    documentId: string,
    metadata: Partial<DocumentMetadata>
  ): Promise<void> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Update metadata
      document.metadata = { ...document.metadata, ...metadata };
      document.updatedAt = new Date();

      await this.fileStorage.updateDocument(document);
      logger.info(`Updated metadata for document ${documentId}`);
    } catch (error: any) {
      logger.error(`Failed to update document metadata: ${error.message}`);
      throw new Error(`Metadata update failed: ${error.message}`);
    }
  }

  async listDocuments(filter?: {
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<Document[]> {
    try {
      const docIds = await this.fileStorage.listDocuments();
      const documents: Document[] = [];

      for (const docId of docIds) {
        const doc = await this.fileStorage.loadDocument(docId);
        if (doc) {
          // Apply tag filter if specified
          if (filter?.tags && filter.tags.length > 0) {
            const hasMatchingTag = filter.tags.some(tag => doc.metadata.tags.includes(tag));
            if (!hasMatchingTag) {
              continue;
            }
          }
          documents.push(doc);
        }
      }

      // Sort by creation date (newest first)
      documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Apply pagination
      const offset = filter?.offset || 0;
      const limit = filter?.limit || documents.length;
      
      return documents.slice(offset, offset + limit);
    } catch (error: any) {
      logger.error(`Failed to list documents: ${error.message}`);
      throw new Error(`Document listing failed: ${error.message}`);
    }
  }

  async searchSimilar(embedding: number[], options: SearchOptions): Promise<SearchResult[]> {
    try {
      const maxResults = options.maxResults || 10;
      
      // Calculate similarities for all chunks
      const similarities: Array<{ chunkId: string; score: number; documentId: string; chunkIndex: number }> = [];
      
      for (const [chunkId, data] of Object.entries(this.vectorIndex)) {
        const score = this.cosineSimilarity(embedding, data.embedding);
        
        // Apply similarity threshold
        if (options.similarityThreshold && score < options.similarityThreshold) {
          continue;
        }
        
        similarities.push({
          chunkId,
          score,
          documentId: data.documentId,
          chunkIndex: data.chunkIndex,
        });
      }
      
      // Sort by score descending
      similarities.sort((a, b) => b.score - a.score);
      
      // Take top N results
      const topResults = similarities.slice(0, maxResults);
      
      // Build search results
      const searchResults: SearchResult[] = [];
      
      for (const result of topResults) {
        // Load full document
        const document = await this.getDocument(result.documentId);
        if (!document) {
          continue;
        }
        
        // Apply tag filter if specified
        if (options.filterTags && options.filterTags.length > 0) {
          const hasMatchingTag = options.filterTags.some(tag => 
            document.metadata.tags.includes(tag)
          );
          if (!hasMatchingTag) {
            continue;
          }
        }
        
        // Find the chunk
        const chunk = document.chunks.find(c => c.index === result.chunkIndex);
        if (!chunk) {
          continue;
        }
        
        searchResults.push({
          chunk,
          document,
          score: result.score,
          distance: 1 - result.score,
        });
      }

      logger.info(`Found ${searchResults.length} search results`);
      return searchResults;
    } catch (error: any) {
      logger.error(`Search failed: ${error.message}`);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async getStats(): Promise<CollectionStats> {
    try {
      const docIds = await this.fileStorage.listDocuments();
      const documents = await Promise.all(
        docIds.map(id => this.fileStorage.loadDocument(id))
      );
      const validDocs = documents.filter((doc): doc is Document => doc !== null);

      const totalChunks = validDocs.reduce((sum, doc) => sum + doc.chunks.length, 0);
      
      // Count file types
      const fileTypes: Record<string, number> = {};
      validDocs.forEach(doc => {
        const type = doc.metadata.fileType;
        fileTypes[type] = (fileTypes[type] || 0) + 1;
      });

      const indexSize = Object.keys(this.vectorIndex).length;

      return {
        totalDocuments: validDocs.length,
        totalChunks,
        collectionSize: indexSize,
        averageChunksPerDocument: validDocs.length > 0 ? totalChunks / validDocs.length : 0,
        fileTypes,
      };
    } catch (error: any) {
      logger.error(`Failed to get stats: ${error.message}`);
      throw new Error(`Stats retrieval failed: ${error.message}`);
    }
  }
}

