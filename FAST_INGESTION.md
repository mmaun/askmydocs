# 🚀 Fast Document Ingestion Guide

The MCP server includes several tools for **much faster** document ingestion than using Claude Desktop's MCP interface.

## ⚡ Why These Methods Are Faster

1. **Direct Processing**: Bypasses MCP protocol overhead
2. **Parallel Processing**: Processes multiple files simultaneously  
3. **Batch Embeddings**: Generates embeddings for all chunks at once
4. **No Network**: Direct file system access
5. **Progress Tracking**: Real-time feedback and metrics

## 🛠️ Available Tools

### 1. Fast CLI Tool (`fast-ingest`)

**Most powerful option** - Full-featured CLI with progress bars, parallel processing, and multiple modes.

```bash
# Install the package first
npm install -g knowledge-mgmt-mcp

# Ingest specific files
fast-ingest files document1.pdf document2.docx document3.txt

# Ingest entire directory
fast-ingest directory ./documents --recursive

# Watch directory for new files (auto-ingest)
fast-ingest watch ./documents --recursive

# With custom options
fast-ingest files *.pdf \
  --parallel 5 \
  --chunk-size 800 \
  --strategy sentence \
  --provider openai \
  --model text-embedding-3-large \
  --tags "legal,contracts" \
  --metadata '{"department":"legal"}'
```

### 2. Simple Batch Script (`batch-ingest`)

**Quick and easy** - Simple Node.js script for batch processing.

```bash
# Process multiple files at once
node dist/cli/batch-ingest.js document1.pdf document2.docx document3.txt

# With custom options (edit the script)
node dist/cli/batch-ingest.js *.pdf
```

### 3. Directory Watcher (`watch-ingest`)

**Automatic processing** - Monitors a directory and auto-ingests new files.

```bash
# Watch directory for new files
node dist/cli/watch-ingest.js ./documents --recursive

# With tags
node dist/cli/watch-ingest.js ./documents --tags "incoming,urgent"
```

## 📊 Performance Comparison

| Method | Speed | Use Case | Setup |
|--------|-------|----------|-------|
| **MCP via Claude** | 1x (baseline) | Interactive, small files | None |
| **Fast CLI** | 5-10x faster | Bulk processing, large datasets | `npm install -g` |
| **Batch Script** | 3-5x faster | Simple automation | Copy script |
| **Directory Watcher** | 2-3x faster | Continuous monitoring | Copy script |

## 🎯 Recommended Workflows

### For Large Document Collections

```bash
# 1. Use fast CLI for bulk ingestion
fast-ingest directory ./large-document-collection \
  --recursive \
  --parallel 4 \
  --provider openai \
  --chunk-size 1000

# 2. Set up watcher for new files
fast-ingest watch ./incoming-documents \
  --recursive \
  --tags "incoming,auto-processed"
```

### For Development/Testing

```bash
# Quick batch processing
node dist/cli/batch-ingest.js test-docs/*.pdf

# Watch for changes during development
node dist/cli/watch-ingest.js ./test-docs
```

### For Production Automation

```bash
# Set up as a service/systemd unit
fast-ingest watch /var/documents/incoming \
  --recursive \
  --provider openai \
  --model text-embedding-3-large \
  --tags "production,auto-ingested"
```

## ⚙️ Configuration Options

### Parallel Processing
- `--parallel 3` (default): Process 3 files simultaneously
- Higher values = faster but more memory usage
- Recommended: 2-5 depending on your system

### Chunking Strategy
- `--strategy sentence` (default): Best for most documents
- `--strategy paragraph`: Better for long-form content
- `--strategy fixed`: For structured/technical documents

### Embedding Provider
- `--provider transformers` (default): Free, local, slower first run
- `--provider openai`: Fast, costs ~$0.0001/1K tokens
- `--provider cohere`: Fast, costs ~$0.0001/1K tokens

### Chunk Size
- `--chunk-size 1000` (default): Good balance
- Smaller (500-800): Better for specific searches
- Larger (1200-1500): Better for context

## 🔧 Environment Variables

Set these for automatic configuration:

```bash
# OpenAI (for fast embeddings)
export OPENAI_API_KEY="your-key-here"
export EMBEDDING_PROVIDER="openai"
export EMBEDDING_MODEL="text-embedding-3-large"

# Cohere (alternative)
export COHERE_API_KEY="your-key-here"
export EMBEDDING_PROVIDER="cohere"

# Storage location
export STORAGE_DIR="/path/to/your/storage"
export CHUNK_SIZE="1000"
export CHUNKING_STRATEGY="sentence"
```

## 📈 Performance Tips

### 1. Choose the Right Embedding Provider
- **OpenAI**: Fastest, best quality, costs money
- **Cohere**: Fast, good quality, costs money  
- **Transformers.js**: Free, slower first run, then fast

### 2. Optimize Parallel Processing
```bash
# For CPU-bound tasks (Transformers.js)
--parallel 2

# For API calls (OpenAI/Cohere)
--parallel 5-10
```

### 3. Batch Similar Files
```bash
# Process all PDFs together
fast-ingest files *.pdf --strategy sentence

# Process all text files together  
fast-ingest files *.txt *.md --strategy paragraph
```

### 4. Use Appropriate Chunk Sizes
```bash
# For search-heavy use cases
--chunk-size 500

# For context-heavy use cases
--chunk-size 1500
```

## 🚨 Troubleshooting

### Out of Memory
```bash
# Reduce parallel processing
--parallel 1

# Reduce chunk size
--chunk-size 500
```

### Slow Embedding Generation
```bash
# Switch to OpenAI/Cohere
--provider openai --model text-embedding-3-large

# Or use smaller local model
--provider transformers --model Xenova/all-MiniLM-L6-v2
```

### File Processing Errors
```bash
# Check file permissions
ls -la your-documents/

# Test with single file first
fast-ingest files single-document.pdf --verbose
```

## 📝 Example Commands

### Quick Start
```bash
# Install globally
npm install -g knowledge-mgmt-mcp

# Ingest a directory
fast-ingest directory ./my-documents --recursive

# Watch for new files
fast-ingest watch ./incoming --recursive
```

### Advanced Usage
```bash
# High-performance bulk ingestion
fast-ingest directory ./large-collection \
  --recursive \
  --parallel 6 \
  --provider openai \
  --model text-embedding-3-large \
  --chunk-size 1200 \
  --strategy sentence \
  --tags "bulk-import,2024" \
  --metadata '{"source":"legacy-system","priority":"high"}' \
  --verbose
```

### Production Setup
```bash
# Create a service script
cat > /usr/local/bin/auto-ingest.sh << 'EOF'
#!/bin/bash
fast-ingest watch /var/documents/incoming \
  --recursive \
  --provider openai \
  --model text-embedding-3-large \
  --tags "production,auto" \
  --parallel 3
EOF

chmod +x /usr/local/bin/auto-ingest.sh

# Run as service
nohup /usr/local/bin/auto-ingest.sh > /var/log/auto-ingest.log 2>&1 &
```

## 🎉 Results

With these tools, you can expect:
- **5-10x faster** ingestion than MCP
- **Real-time progress** tracking
- **Automatic processing** of new files
- **Better error handling** and recovery
- **Production-ready** automation

Happy fast ingesting! 🚀
