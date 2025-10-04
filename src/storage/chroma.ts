/**
 * ChromaDB storage backend for vector embeddings and search
 */

import { ChromaClient, Collection } from 'chromadb';
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

export class ChromaStorage implements StorageBackend {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private fileStorage: FileSystemStorage;
  private collectionName = 'knowledge_mgmt';

  constructor(chromaDbPath: string, storageDir: string) {
    // ChromaDB npm client uses default configuration (in-memory)
    // The path parameter is only for server URLs, not local file paths
    this.client = new ChromaClient();
    this.fileStorage = new FileSystemStorage(storageDir);
  }

  async initialize(): Promise<void> {
    try {
      await this.fileStorage.initialize();
      
      // Get or create collection
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: { 'hnsw:space': 'cosine' },
      });
      
      logger.info(`ChromaDB initialized with collection: ${this.collectionName}`);
    } catch (error: any) {
      logger.error(`Failed to initialize ChromaDB: ${error.message}`);
      throw new Error(`ChromaDB initialization failed: ${error.message}`);
    }
  }

  async storeDocument(document: Document): Promise<void> {
    if (!this.collection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      // Store document metadata in filesystem
      await this.fileStorage.saveDocument(document);

      // Store chunks with embeddings in ChromaDB
      if (document.chunks.length > 0) {
        const ids = document.chunks.map(chunk => `${document.id}_chunk_${chunk.index}`);
        const embeddings = document.chunks.map(chunk => chunk.embedding!);
        const documents = document.chunks.map(chunk => chunk.content);
        const metadatas = document.chunks.map(chunk => ({
          documentId: document.id,
          chunkIndex: chunk.index,
          startChar: chunk.metadata.startChar,
          endChar: chunk.metadata.endChar,
          filename: document.metadata.filename || '',
          fileType: document.metadata.fileType,
          tags: JSON.stringify(document.metadata.tags),
          ...document.metadata.customMetadata,
        }));

        await this.collection.add({
          ids,
          embeddings,
          documents,
          metadatas,
        });

        logger.info(`Stored document ${document.id} with ${document.chunks.length} chunks in ChromaDB`);
      }
    } catch (error: any) {
      logger.error(`Failed to store document in ChromaDB: ${error.message}`);
      throw new Error(`Document storage failed: ${error.message}`);
    }
  }

  async getDocument(documentId: string): Promise<Document | null> {
    return await this.fileStorage.loadDocument(documentId);
  }

  async deleteDocument(documentId: string): Promise<void> {
    if (!this.collection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      // Delete from filesystem
      await this.fileStorage.deleteDocument(documentId);

      // Delete chunks from ChromaDB
      const results = await this.collection.get({
        where: { documentId },
      });

      if (results.ids.length > 0) {
        await this.collection.delete({
          ids: results.ids,
        });
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
    if (!this.collection) {
      throw new Error('ChromaDB not initialized');
    }

    try {
      const maxResults = options.maxResults || 10;
      
      // Build where filter
      const where: any = {};
      if (options.filterMetadata) {
        Object.assign(where, options.filterMetadata);
      }

      // Query ChromaDB
      const results = await this.collection.query({
        queryEmbeddings: [embedding],
        nResults: maxResults,
        where: Object.keys(where).length > 0 ? where : undefined,
      });

      if (!results.ids || !results.ids[0] || results.ids[0].length === 0) {
        return [];
      }

      // Convert results to SearchResult format
      const searchResults: SearchResult[] = [];
      
      for (let i = 0; i < results.ids[0].length; i++) {
        const chunkId = results.ids[0][i];
        const distance = results.distances?.[0]?.[i] || 0;
        const score = 1 - distance; // Convert distance to similarity score
        
        // Apply similarity threshold
        if (options.similarityThreshold && score < options.similarityThreshold) {
          continue;
        }

        const metadata = results.metadatas?.[0]?.[i] as any;
        const content = results.documents?.[0]?.[i] || '';
        const documentId = metadata?.documentId;

        if (!documentId) {
          continue;
        }

        // Load full document
        const document = await this.getDocument(documentId);
        if (!document) {
          continue;
        }

        // Find the chunk
        const chunk = document.chunks.find(c => c.index === metadata.chunkIndex);
        if (!chunk) {
          continue;
        }

        searchResults.push({
          chunk,
          document,
          score,
          distance,
        });
      }

      // Apply tag filter if specified
      if (options.filterTags && options.filterTags.length > 0) {
        return searchResults.filter(result => 
          options.filterTags!.some(tag => result.document.metadata.tags.includes(tag))
        );
      }

      logger.info(`Found ${searchResults.length} search results`);
      return searchResults;
    } catch (error: any) {
      logger.error(`Search failed: ${error.message}`);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async getStats(): Promise<CollectionStats> {
    if (!this.collection) {
      throw new Error('ChromaDB not initialized');
    }

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

      const count = await this.collection.count();

      return {
        totalDocuments: validDocs.length,
        totalChunks,
        collectionSize: count,
        averageChunksPerDocument: validDocs.length > 0 ? totalChunks / validDocs.length : 0,
        fileTypes,
      };
    } catch (error: any) {
      logger.error(`Failed to get stats: ${error.message}`);
      throw new Error(`Stats retrieval failed: ${error.message}`);
    }
  }
}

