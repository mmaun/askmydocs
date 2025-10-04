/**
 * MCP Server setup and tool registration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ServerConfig } from './types/index.js';
import { createEmbeddingProvider } from './embeddings/index.js';
import { ChromaStorage } from './storage/index.js';
import { IngestTool, SearchTool, ManagementTool } from './tools/index.js';
import { logger } from './utils/logger.js';

export class KnowledgeManagementServer {
  private server: Server;
  private ingestTool: IngestTool;
  private searchTool: SearchTool;
  private managementTool: ManagementTool;

  constructor(private config: ServerConfig) {
    this.server = new Server(
      {
        name: 'knowledge-mgmt-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize tools (will be done in start())
    this.ingestTool = null as any;
    this.searchTool = null as any;
    this.managementTool = null as any;

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'ingest_document',
          description: 'Ingest a document from file path or raw text content. Supports PDF, DOCX, TXT, MD, CSV, JSON, HTML.',
          inputSchema: {
            type: 'object',
            properties: {
              file_path: {
                type: 'string',
                description: 'Path to the file to ingest (mutually exclusive with text_content)',
              },
              text_content: {
                type: 'string',
                description: 'Raw text content to ingest (mutually exclusive with file_path)',
              },
              metadata: {
                type: 'object',
                description: 'Optional custom metadata as key-value pairs',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional tags for categorization',
              },
            },
          },
        },
        {
          name: 'search_knowledge',
          description: 'Search the knowledge base using semantic search. Returns relevant chunks with similarity scores.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query text',
              },
              max_results: {
                type: 'number',
                description: 'Maximum number of results to return (default: 10)',
              },
              similarity_threshold: {
                type: 'number',
                description: 'Minimum similarity score (0-1) to include in results (default: 0.0)',
              },
              filter_metadata: {
                type: 'object',
                description: 'Optional metadata filters',
              },
              filter_tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional tag filters',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'list_documents',
          description: 'List all ingested documents with optional filtering by tags.',
          inputSchema: {
            type: 'object',
            properties: {
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter by tags',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of documents to return (default: 50)',
              },
              offset: {
                type: 'number',
                description: 'Number of documents to skip (default: 0)',
              },
            },
          },
        },
        {
          name: 'get_document',
          description: 'Retrieve full document content and all chunks by document ID.',
          inputSchema: {
            type: 'object',
            properties: {
              document_id: {
                type: 'string',
                description: 'Document ID',
              },
            },
            required: ['document_id'],
          },
        },
        {
          name: 'delete_document',
          description: 'Delete a document and all its chunks from the knowledge base.',
          inputSchema: {
            type: 'object',
            properties: {
              document_id: {
                type: 'string',
                description: 'Document ID to delete',
              },
            },
            required: ['document_id'],
          },
        },
        {
          name: 'update_document_metadata',
          description: 'Update document metadata and tags.',
          inputSchema: {
            type: 'object',
            properties: {
              document_id: {
                type: 'string',
                description: 'Document ID',
              },
              metadata: {
                type: 'object',
                description: 'Custom metadata to update',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags to replace existing tags',
              },
            },
            required: ['document_id'],
          },
        },
        {
          name: 'get_collection_stats',
          description: 'Get statistics about the knowledge base collection.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'batch_ingest',
          description: 'Ingest multiple documents from a directory with optional file pattern filtering.',
          inputSchema: {
            type: 'object',
            properties: {
              directory_path: {
                type: 'string',
                description: 'Path to directory containing files to ingest',
              },
              file_patterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'File patterns to match (e.g., ["*.pdf", "*.txt"]). Use ["*"] for all files.',
              },
              recursive: {
                type: 'boolean',
                description: 'Whether to search subdirectories recursively (default: true)',
              },
            },
            required: ['directory_path'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        logger.info(`Tool called: ${name}`);

        switch (name) {
          case 'ingest_document': {
            const result = await this.ingestTool.ingestDocument(args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'search_knowledge': {
            const result = await this.searchTool.searchKnowledge(args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'list_documents': {
            const result = await this.managementTool.listDocuments(args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'get_document': {
            const result = await this.managementTool.getDocument(args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'delete_document': {
            const result = await this.managementTool.deleteDocument(args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'update_document_metadata': {
            const result = await this.managementTool.updateDocumentMetadata(args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'get_collection_stats': {
            const result = await this.managementTool.getCollectionStats();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'batch_ingest': {
            const result = await this.ingestTool.batchIngest(args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        logger.error(`Tool execution failed: ${error.message}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: error.message,
                  tool: name,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start(): Promise<void> {
    try {
      logger.info('Initializing Knowledge Management MCP Server...');

      // Initialize embedding provider
      logger.info(`Initializing embedding provider: ${this.config.embeddingConfig.provider}`);
      const embeddingProvider = createEmbeddingProvider(this.config.embeddingConfig);

      // Initialize storage
      logger.info('Initializing storage backend...');
      const storage = new ChromaStorage(this.config.chromaDbDir, this.config.storageDir);
      await storage.initialize();

      // Initialize tools
      this.ingestTool = new IngestTool(this.config, embeddingProvider, storage);
      this.searchTool = new SearchTool(embeddingProvider, storage);
      this.managementTool = new ManagementTool(storage);

      logger.info('All components initialized successfully');

      // Start server with stdio transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      logger.info('Knowledge Management MCP Server started successfully');
    } catch (error: any) {
      logger.error(`Server startup failed: ${error.message}`);
      throw error;
    }
  }
}

