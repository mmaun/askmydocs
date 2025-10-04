# Knowledge Management MCP Server

A production-ready Model Context Protocol (MCP) server that provides document ingestion, vector search, and knowledge management capabilities. Built with TypeScript/Node.js, ChromaDB, and support for multiple embedding providers.

## Features

- 📄 **Multi-Format Support**: PDF, DOCX, TXT, MD, CSV, JSON, HTML
- 🔍 **Semantic Search**: Vector-based similarity search with ChromaDB
- 🧠 **Multiple Embedding Providers**: Transformers.js (local), OpenAI, Cohere
- 📊 **Intelligent Chunking**: Sentence-aware, paragraph-aware, or fixed-size strategies
- 🏷️ **Metadata & Tags**: Organize documents with custom metadata and tags
- 🔄 **Batch Processing**: Ingest entire directories at once
- 🚀 **NPX Ready**: Run instantly with `npx` - no installation required

## Quick Start

### 1. Configure in Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "knowledge_mgmt": {
      "command": "npx",
      "args": ["-y", "knowledge-mgmt-mcp"],
      "env": {
        "STORAGE_DIR": "/Users/yourname/knowledge-storage",
        "CHROMA_DB_DIR": "/Users/yourname/knowledge-chroma",
        "EMBEDDING_PROVIDER": "transformers",
        "EMBEDDING_MODEL": "Xenova/all-MiniLM-L6-v2",
        "CHUNK_SIZE": "1000",
        "CHUNK_OVERLAP": "200",
        "CHUNKING_STRATEGY": "sentence"
      }
    }
  }
}
```

### 2. Restart Claude Desktop

The server will automatically download and start when Claude needs it.

### 3. Start Using It

Ask Claude to help you:
- "Ingest this PDF document for me"
- "Search my documents for information about X"
- "List all my ingested documents"
- "What are the statistics of my knowledge base?"

## Configuration Options

### Environment Variables

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `STORAGE_DIR` | Directory for document storage | `~/.knowledge-mgmt-mcp/storage` | Any valid path |
| `CHROMA_DB_DIR` | ChromaDB database directory | `~/.knowledge-mgmt-mcp/chroma_db` | Any valid path |
| `EMBEDDING_PROVIDER` | Embedding provider to use | `transformers` | `transformers`, `openai`, `cohere` |
| `EMBEDDING_MODEL` | Model to use for embeddings | `Xenova/all-MiniLM-L6-v2` | See below |
| `OPENAI_API_KEY` | OpenAI API key (if using OpenAI) | - | Your API key |
| `COHERE_API_KEY` | Cohere API key (if using Cohere) | - | Your API key |
| `CHUNK_SIZE` | Maximum chunk size in characters | `1000` | 100-10000 |
| `CHUNK_OVERLAP` | Overlap between chunks | `200` | 0-500 |
| `CHUNKING_STRATEGY` | Chunking method | `sentence` | `sentence`, `paragraph`, `fixed` |
| `MAX_FILE_SIZE` | Max file size in bytes | `104857600` (100MB) | Any number |
| `ALLOWED_FILE_TYPES` | Comma-separated file types | `pdf,docx,txt,md,csv,json,html` | Any subset |
| `LOG_LEVEL` | Logging verbosity | `INFO` | `DEBUG`, `INFO`, `WARN`, `ERROR` |

### Embedding Provider Options

#### Transformers.js (Local - No API Key Required)
```json
{
  "EMBEDDING_PROVIDER": "transformers",
  "EMBEDDING_MODEL": "Xenova/all-MiniLM-L6-v2"
}
```

**Available Models:**
- `Xenova/all-MiniLM-L6-v2` (384 dimensions, fast)
- `Xenova/all-mpnet-base-v2` (768 dimensions, more accurate)

#### OpenAI
```json
{
  "EMBEDDING_PROVIDER": "openai",
  "EMBEDDING_MODEL": "text-embedding-3-small",
  "OPENAI_API_KEY": "sk-..."
}
```

**Available Models:**
- `text-embedding-3-small` (1536 dimensions)
- `text-embedding-3-large` (3072 dimensions)
- `text-embedding-ada-002` (1536 dimensions)

#### Cohere
```json
{
  "EMBEDDING_PROVIDER": "cohere",
  "EMBEDDING_MODEL": "embed-english-v3.0",
  "COHERE_API_KEY": "..."
}
```

**Available Models:**
- `embed-english-v3.0` (1024 dimensions)
- `embed-multilingual-v3.0` (1024 dimensions)

## Available Tools

### 1. `ingest_document`

Ingest a document from file path or raw text.

**Parameters:**
- `file_path` (string, optional): Path to file (mutually exclusive with text_content)
- `text_content` (string, optional): Raw text content (mutually exclusive with file_path)
- `metadata` (object, optional): Custom metadata key-value pairs
- `tags` (array, optional): Tags for categorization

**Example:**
```json
{
  "file_path": "/path/to/document.pdf",
  "tags": ["research", "2024"],
  "metadata": {
    "author": "John Doe",
    "project": "AI Research"
  }
}
```

**Returns:**
```json
{
  "documentId": "doc_1234567890_abc123",
  "chunksCreated": 15,
  "status": "success",
  "message": "Document ingested successfully with 15 chunks"
}
```

### 2. `search_knowledge`

Search the knowledge base semantically.

**Parameters:**
- `query` (string, required): Search query
- `max_results` (number, optional): Maximum results (default: 10)
- `similarity_threshold` (number, optional): Minimum similarity 0-1 (default: 0.0)
- `filter_metadata` (object, optional): Filter by metadata
- `filter_tags` (array, optional): Filter by tags

**Example:**
```json
{
  "query": "What are the key findings about machine learning?",
  "max_results": 5,
  "similarity_threshold": 0.7,
  "filter_tags": ["research"]
}
```

**Returns:**
```json
{
  "results": [
    {
      "content": "Machine learning models showed 95% accuracy...",
      "source": "research_paper.pdf",
      "score": 0.89,
      "metadata": {
        "document_id": "doc_1234567890_abc123",
        "file_type": "pdf",
        "tags": ["research", "2024"]
      },
      "chunk_index": 3
    }
  ],
  "total_results": 5
}
```

### 3. `list_documents`

List all ingested documents.

**Parameters:**
- `tags` (array, optional): Filter by tags
- `limit` (number, optional): Max documents (default: 50)
- `offset` (number, optional): Skip documents (default: 0)

**Returns:**
```json
{
  "documents": [
    {
      "id": "doc_1234567890_abc123",
      "filename": "research_paper.pdf",
      "file_type": "pdf",
      "tags": ["research", "2024"],
      "chunks_count": 15,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

### 4. `get_document`

Retrieve full document content and chunks.

**Parameters:**
- `document_id` (string, required): Document ID

**Returns:**
```json
{
  "id": "doc_1234567890_abc123",
  "content": "Full document text...",
  "filename": "research_paper.pdf",
  "file_type": "pdf",
  "tags": ["research"],
  "chunks": [
    {
      "index": 0,
      "content": "First chunk content...",
      "start_char": 0,
      "end_char": 1000
    }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 5. `delete_document`

Delete a document and its chunks.

**Parameters:**
- `document_id` (string, required): Document ID

**Returns:**
```json
{
  "success": true,
  "message": "Document doc_1234567890_abc123 deleted successfully"
}
```

### 6. `update_document_metadata`

Update document metadata and tags.

**Parameters:**
- `document_id` (string, required): Document ID
- `metadata` (object, optional): Custom metadata to update
- `tags` (array, optional): Replace existing tags

**Returns:**
```json
{
  "success": true,
  "message": "Document metadata updated successfully"
}
```

### 7. `get_collection_stats`

Get knowledge base statistics.

**Returns:**
```json
{
  "total_documents": 10,
  "total_chunks": 150,
  "collection_size": 150,
  "average_chunks_per_document": 15,
  "file_types": {
    "pdf": 5,
    "docx": 3,
    "txt": 2
  }
}
```

### 8. `batch_ingest`

Ingest multiple documents from a directory.

**Parameters:**
- `directory_path` (string, required): Directory path
- `file_patterns` (array, optional): Patterns like `["*.pdf", "*.txt"]` (default: `["*"]`)
- `recursive` (boolean, optional): Search subdirectories (default: true)

**Example:**
```json
{
  "directory_path": "/path/to/documents",
  "file_patterns": ["*.pdf", "*.docx"],
  "recursive": true
}
```

**Returns:**
```json
{
  "totalFiles": 10,
  "successCount": 9,
  "failedCount": 1,
  "documents": [...],
  "errors": [
    {
      "file": "/path/to/corrupt.pdf",
      "error": "PDF processing failed"
    }
  ]
}
```

## Chunking Strategies

### Sentence-Aware (Default)
Splits text at sentence boundaries, respecting natural language structure.

**Best for:** General documents, articles, research papers

**Pros:** Maintains semantic coherence
**Cons:** Variable chunk sizes

### Paragraph-Aware
Splits text at paragraph boundaries (double newlines).

**Best for:** Documents with clear paragraph structure

**Pros:** Preserves document structure
**Cons:** May create very large or small chunks

### Fixed-Size
Splits text into fixed-size chunks with overlap.

**Best for:** Uniform processing, technical documents

**Pros:** Predictable chunk sizes
**Cons:** May split mid-sentence

## Supported File Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| PDF | `.pdf` | Portable Document Format |
| Word | `.docx` | Microsoft Word documents |
| Text | `.txt` | Plain text files |
| Markdown | `.md` | Markdown formatted text |
| CSV | `.csv` | Comma-separated values |
| JSON | `.json` | JSON data files |
| HTML | `.html`, `.htm` | Web pages |

## Troubleshooting

### Server Not Starting

1. **Check logs**: Set `LOG_LEVEL=DEBUG` to see detailed logs
2. **Verify paths**: Ensure `STORAGE_DIR` and `CHROMA_DB_DIR` are writable
3. **Check Node version**: Requires Node.js 18+

```bash
node --version  # Should be 18.0.0 or higher
```

### Embedding Generation Slow

**Using Transformers.js?** First run downloads the model (~100MB). Subsequent runs are fast.

**Solution:** Use a smaller model like `Xenova/all-MiniLM-L6-v2` or switch to OpenAI/Cohere for faster processing.

### Out of Memory

**Large documents?** Reduce `CHUNK_SIZE` or process files individually instead of batch ingestion.

```json
{
  "CHUNK_SIZE": "500",
  "MAX_FILE_SIZE": "10485760"
}
```

### ChromaDB Connection Error

**Solution:** Ensure `CHROMA_DB_DIR` exists and is writable:

```bash
mkdir -p ~/knowledge-chroma
chmod 755 ~/knowledge-chroma
```

### File Processing Failures

**PDF extraction issues?** Some PDFs are scanned images. Use OCR preprocessing before ingestion.

**DOCX errors?** Ensure file isn't corrupted. Try opening in Word first.

## Development

### Local Setup

```bash
# Clone repository
git clone https://github.com/yourusername/knowledge-mgmt-mcp.git
cd knowledge-mgmt-mcp

# Install dependencies
npm install

# Build
npm run build

# Test locally
npm link
```

### Testing with Claude Desktop

```json
{
  "mcpServers": {
    "knowledge_mgmt_dev": {
      "command": "node",
      "args": ["/absolute/path/to/knowledge-mgmt-mcp/dist/index.js"],
      "env": {
        "LOG_LEVEL": "DEBUG",
        ...
      }
    }
  }
}
```

## Performance Tips

1. **Choose the right embedding provider:**
   - Local (Transformers.js): Free, private, slower first run
   - OpenAI: Fast, costs $0.0001/1K tokens
   - Cohere: Fast, costs $0.0001/1K tokens

2. **Optimize chunk size:**
   - Smaller chunks (500-800): Better for specific searches
   - Larger chunks (1000-1500): Better for context

3. **Use appropriate chunking strategy:**
   - Sentence: Most documents
   - Paragraph: Long-form content
   - Fixed: Technical/structured data

4. **Batch operations:**
   - Use `batch_ingest` for multiple files
   - Process directories rather than individual files

## Security Considerations

- **File path validation**: Prevents directory traversal attacks
- **Input sanitization**: All user inputs are validated
- **API key security**: Never log or expose API keys
- **File size limits**: Configurable max file size prevents abuse
- **Rate limiting**: Consider implementing rate limiting for production

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## Support

**Help with configuration**: email hello@biznezstack.com
- **Issues**: [GitHub Issues](https://github.com/yourusername/knowledge-mgmt-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/knowledge-mgmt-mcp/discussions)

## Changelog

### v1.0.0 (Initial Release)
- Multi-format document ingestion
- Semantic search with ChromaDB
- Multiple embedding providers
- Intelligent chunking strategies
- Complete MCP tool implementation
- Comprehensive error handling
- Full documentation

