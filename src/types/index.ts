/**
 * Core types and interfaces for the Knowledge Management MCP Server
 */

export interface Document {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  chunks: DocumentChunk[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentMetadata {
  filename?: string;
  filePath?: string;
  fileType: string;
  tags: string[];
  customMetadata: Record<string, any>;
  size?: number;
  pageCount?: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  index: number;
  embedding?: number[];
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  startChar: number;
  endChar: number;
  tokens?: number;
  section?: string;
  page?: number;
}

export interface SearchResult {
  chunk: DocumentChunk;
  document: Document;
  score: number;
  distance: number;
}

export interface IngestResult {
  documentId: string;
  chunksCreated: number;
  status: 'success' | 'error';
  message?: string;
}

export interface BatchIngestResult {
  totalFiles: number;
  successCount: number;
  failedCount: number;
  documents: IngestResult[];
  errors: Array<{ file: string; error: string }>;
}

export interface CollectionStats {
  totalDocuments: number;
  totalChunks: number;
  collectionSize: number;
  averageChunksPerDocument: number;
  fileTypes: Record<string, number>;
}

export interface SearchOptions {
  query: string;
  maxResults?: number;
  similarityThreshold?: number;
  filterMetadata?: Record<string, any>;
  filterTags?: string[];
}

export interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
  strategy: 'sentence' | 'paragraph' | 'fixed';
}

export interface EmbeddingConfig {
  provider: 'transformers' | 'openai' | 'cohere';
  model: string;
  apiKey?: string;
  dimensions?: number;
}

export interface ServerConfig {
  storageDir: string;
  chromaDbDir: string;
  embeddingConfig: EmbeddingConfig;
  chunkingOptions: ChunkingOptions;
  maxFileSize: number; // in bytes
  allowedFileTypes: string[];
}

export type FileType = 'pdf' | 'docx' | 'txt' | 'md' | 'csv' | 'json' | 'html';

export interface FileProcessor {
  canProcess(fileType: string): boolean;
  process(filePath: string): Promise<string>;
}

export interface ChunkingStrategy {
  chunk(text: string, options: ChunkingOptions): DocumentChunk[];
}

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
}

export interface StorageBackend {
  initialize(): Promise<void>;
  storeDocument(document: Document): Promise<void>;
  getDocument(documentId: string): Promise<Document | null>;
  deleteDocument(documentId: string): Promise<void>;
  updateDocumentMetadata(documentId: string, metadata: Partial<DocumentMetadata>): Promise<void>;
  listDocuments(filter?: { tags?: string[]; limit?: number; offset?: number }): Promise<Document[]>;
  searchSimilar(embedding: number[], options: SearchOptions): Promise<SearchResult[]>;
  getStats(): Promise<CollectionStats>;
}

