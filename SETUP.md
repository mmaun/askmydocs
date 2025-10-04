# Setup Guide

## Installation & Testing

### Option 1: NPX (Recommended for Users)

Once published to NPM, users can run:

```bash
npx -y knowledge-mgmt-mcp
```

### Option 2: Local Development

1. **Clone and Build**
```bash
git clone https://github.com/yourusername/knowledge-mgmt-mcp.git
cd knowledge-mgmt-mcp
npm install
npm run build
```

2. **Test Locally**
```bash
npm link
```

3. **Configure Claude Desktop**

Edit your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "knowledge_mgmt_dev": {
      "command": "node",
      "args": ["/absolute/path/to/knowledge-mgmt-mcp/dist/index.js"],
      "env": {
        "STORAGE_DIR": "/Users/yourname/knowledge-storage",
        "CHROMA_DB_DIR": "/Users/yourname/knowledge-chroma",
        "EMBEDDING_PROVIDER": "transformers",
        "EMBEDDING_MODEL": "Xenova/all-MiniLM-L6-v2",
        "CHUNK_SIZE": "1000",
        "CHUNK_OVERLAP": "200",
        "CHUNKING_STRATEGY": "sentence",
        "LOG_LEVEL": "DEBUG"
      }
    }
  }
}
```

4. **Restart Claude Desktop**

## Publishing to NPM

### Prerequisites

1. **NPM Account**: Create account at [npmjs.com](https://www.npmjs.com/)
2. **Login**: `npm login`

### Publishing Steps

1. **Update package.json**
   - Set proper `name` (must be unique on NPM)
   - Update `version`
   - Add your `author` info
   - Update `repository` URL

2. **Build**
```bash
npm run build
```

3. **Test Package Locally**
```bash
# Pack the package
npm pack

# Test installation
npm install -g ./knowledge-mgmt-mcp-1.0.0.tgz

# Test running
knowledge-mgmt-mcp

# Uninstall test
npm uninstall -g knowledge-mgmt-mcp
```

4. **Publish**
```bash
# First time (public package)
npm publish --access public

# Subsequent updates
npm version patch  # or minor, major
npm publish
```

5. **Verify**
```bash
# Test npx installation
npx -y knowledge-mgmt-mcp
```

## Configuration Examples

### Example 1: Local Embeddings (Free)

```json
{
  "env": {
    "STORAGE_DIR": "/Users/yourname/knowledge-storage",
    "CHROMA_DB_DIR": "/Users/yourname/knowledge-chroma",
    "EMBEDDING_PROVIDER": "transformers",
    "EMBEDDING_MODEL": "Xenova/all-MiniLM-L6-v2"
  }
}
```

### Example 2: OpenAI Embeddings

```json
{
  "env": {
    "STORAGE_DIR": "/Users/yourname/knowledge-storage",
    "CHROMA_DB_DIR": "/Users/yourname/knowledge-chroma",
    "EMBEDDING_PROVIDER": "openai",
    "EMBEDDING_MODEL": "text-embedding-3-small",
    "OPENAI_API_KEY": "sk-..."
  }
}
```

### Example 3: Cohere Embeddings

```json
{
  "env": {
    "STORAGE_DIR": "/Users/yourname/knowledge-storage",
    "CHROMA_DB_DIR": "/Users/yourname/knowledge-chroma",
    "EMBEDDING_PROVIDER": "cohere",
    "EMBEDDING_MODEL": "embed-english-v3.0",
    "COHERE_API_KEY": "your-cohere-key"
  }
}
```

### Example 4: Custom Chunking

```json
{
  "env": {
    "STORAGE_DIR": "/Users/yourname/knowledge-storage",
    "CHROMA_DB_DIR": "/Users/yourname/knowledge-chroma",
    "EMBEDDING_PROVIDER": "transformers",
    "EMBEDDING_MODEL": "Xenova/all-MiniLM-L6-v2",
    "CHUNK_SIZE": "500",
    "CHUNK_OVERLAP": "100",
    "CHUNKING_STRATEGY": "paragraph"
  }
}
```

## Testing

### Manual Testing

1. **Start Claude Desktop** with your configuration
2. **Test ingestion**:
   - Ask: "Ingest this document: /path/to/test.pdf"
3. **Test search**:
   - Ask: "Search for 'machine learning' in my documents"
4. **Test listing**:
   - Ask: "List all my documents"
5. **Test stats**:
   - Ask: "What are my knowledge base statistics?"

### Sample Documents

Create test files in `/tmp/test-docs/`:

**test.txt**:
```
This is a sample document about artificial intelligence.
Machine learning is a subset of AI that focuses on data-driven learning.
Neural networks are inspired by biological neurons.
```

**test.md**:
```markdown
# Machine Learning Guide

## Introduction
Machine learning enables computers to learn from data.

## Key Concepts
- Supervised Learning
- Unsupervised Learning
- Reinforcement Learning
```

**test.json**:
```json
{
  "title": "AI Research",
  "topics": ["machine learning", "neural networks"],
  "year": 2024
}
```

### Test Batch Ingestion

Ask Claude:
```
Ingest all documents from /tmp/test-docs/ recursively
```

## Troubleshooting

### Build Errors

```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

### Runtime Errors

1. **Check logs**: Set `LOG_LEVEL=DEBUG`
2. **Verify Node version**: `node --version` (must be 18+)
3. **Check permissions**: Ensure storage directories are writable

### ChromaDB Issues

```bash
# Remove and reinitialize
rm -rf ~/knowledge-chroma
# Restart Claude Desktop
```

## Development Workflow

1. **Make changes** in `src/`
2. **Build**: `npm run build`
3. **Test**: Restart Claude Desktop
4. **Verify**: Check logs and test functionality
5. **Commit**: `git commit -am "Your changes"`

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STORAGE_DIR` | No | `~/.knowledge-mgmt-mcp/storage` | Document storage |
| `CHROMA_DB_DIR` | No | `~/.knowledge-mgmt-mcp/chroma_db` | Vector DB |
| `EMBEDDING_PROVIDER` | No | `transformers` | Provider type |
| `EMBEDDING_MODEL` | No | `Xenova/all-MiniLM-L6-v2` | Model name |
| `OPENAI_API_KEY` | If OpenAI | - | OpenAI key |
| `COHERE_API_KEY` | If Cohere | - | Cohere key |
| `CHUNK_SIZE` | No | `1000` | Max chunk size |
| `CHUNK_OVERLAP` | No | `200` | Chunk overlap |
| `CHUNKING_STRATEGY` | No | `sentence` | Strategy type |
| `MAX_FILE_SIZE` | No | `104857600` | Max file bytes |
| `ALLOWED_FILE_TYPES` | No | All supported | File types |
| `LOG_LEVEL` | No | `INFO` | Log verbosity |

## Next Steps

1. Test the server thoroughly
2. Create sample documents for testing
3. Test all tools (ingest, search, list, etc.)
4. Monitor logs for any issues
5. Gather user feedback
6. Iterate and improve

