# Quick Start Guide

Get up and running with Knowledge Management MCP in 5 minutes!

## Step 1: Install (via NPX - easiest)

No installation needed! Just configure Claude Desktop.

## Step 2: Configure Claude Desktop

Edit your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "knowledge": {
      "command": "npx",
      "args": ["-y", "knowledge-mgmt-mcp"],
      "env": {
        "STORAGE_DIR": "/Users/yourname/Documents/knowledge-storage",
        "CHROMA_DB_DIR": "/Users/yourname/Documents/knowledge-chroma",
        "EMBEDDING_PROVIDER": "transformers",
        "EMBEDDING_MODEL": "Xenova/all-MiniLM-L6-v2"
      }
    }
  }
}
```

**Important**: Replace `/Users/yourname/Documents/` with your actual path!

## Step 3: Restart Claude Desktop

Quit and restart Claude Desktop completely.

## Step 4: Test It!

### Test 1: Ingest a Document

Say to Claude:
```
Can you ingest this document for me: /path/to/your/document.pdf
```

Claude will use the `ingest_document` tool to process it.

### Test 2: Search Your Knowledge

Say to Claude:
```
Search my documents for information about [your topic]
```

Claude will use the `search_knowledge` tool to find relevant content.

### Test 3: List Your Documents

Say to Claude:
```
Show me all the documents I've ingested
```

Claude will use the `list_documents` tool.

### Test 4: Get Statistics

Say to Claude:
```
What are the statistics of my knowledge base?
```

Claude will use the `get_collection_stats` tool.

## Common Commands

### Ingesting Content

**From file:**
```
Ingest /path/to/document.pdf with tags research and ai
```

**From text:**
```
Save this note: [your text content]
```

**Batch ingest:**
```
Ingest all PDF files from /path/to/folder
```

### Searching

**Basic search:**
```
Search for machine learning
```

**Filtered search:**
```
Search for neural networks in documents tagged with research
```

**Specific search:**
```
Find information about transformers with similarity threshold 0.8
```

### Managing Documents

**List documents:**
```
List all my documents
Show documents tagged with research
```

**Get document:**
```
Show me the full content of document doc_123456
```

**Delete document:**
```
Delete document doc_123456
```

**Update metadata:**
```
Update document doc_123456 with tags research, important
```

## Supported File Types

| Type | Extension | Example |
|------|-----------|---------|
| PDF | `.pdf` | research.pdf |
| Word | `.docx` | report.docx |
| Text | `.txt` | notes.txt |
| Markdown | `.md` | readme.md |
| CSV | `.csv` | data.csv |
| JSON | `.json` | config.json |
| HTML | `.html` | page.html |

## Configuration Options

### Use OpenAI (Faster, Costs Money)

```json
{
  "env": {
    "EMBEDDING_PROVIDER": "openai",
    "EMBEDDING_MODEL": "text-embedding-3-small",
    "OPENAI_API_KEY": "sk-your-key-here",
    "STORAGE_DIR": "/path/to/storage",
    "CHROMA_DB_DIR": "/path/to/chroma"
  }
}
```

### Use Cohere

```json
{
  "env": {
    "EMBEDDING_PROVIDER": "cohere",
    "EMBEDDING_MODEL": "embed-english-v3.0",
    "COHERE_API_KEY": "your-key-here",
    "STORAGE_DIR": "/path/to/storage",
    "CHROMA_DB_DIR": "/path/to/chroma"
  }
}
```

### Adjust Chunk Size

```json
{
  "env": {
    "CHUNK_SIZE": "500",
    "CHUNK_OVERLAP": "100",
    "CHUNKING_STRATEGY": "paragraph",
    ...
  }
}
```

## Troubleshooting

### "Server not responding"

1. Check Claude Desktop config file is valid JSON
2. Restart Claude Desktop
3. Check paths exist and are writable:
   ```bash
   mkdir -p ~/Documents/knowledge-storage
   mkdir -p ~/Documents/knowledge-chroma
   ```

### "Model downloading..."

First run with Transformers.js downloads ~100MB model. This is normal and only happens once.

### "File processing failed"

- Check file exists and is readable
- Check file type is supported
- Try with a smaller file first

### "Search returns no results"

- Check documents were ingested successfully (use "list documents")
- Lower similarity threshold
- Try more general search terms

## Tips for Best Results

### 1. Use Descriptive Tags

✅ Good:
```
tags: ["research", "machine-learning", "2024", "reviewed"]
```

❌ Bad:
```
tags: ["doc", "file"]
```

### 2. Add Rich Metadata

✅ Good:
```
metadata: {
  "author": "John Doe",
  "date": "2024-01-15",
  "project": "AI Research",
  "priority": "high"
}
```

### 3. Use Specific Search Queries

✅ Good:
```
"Search for transformer architectures in natural language processing"
```

❌ Bad:
```
"Search for AI"
```

### 4. Organize with Tags

Create a tagging system:
- `type:research`, `type:note`, `type:documentation`
- `year:2024`, `year:2023`
- `status:active`, `status:archived`
- `priority:high`, `priority:low`

### 5. Regular Maintenance

Periodically:
- Review and update metadata
- Delete outdated documents
- Check collection statistics
- Update tags for better organization

## Next Steps

1. ✅ Configured and running
2. 📚 Read [README.md](README.md) for full documentation
3. 💡 Check [EXAMPLES.md](EXAMPLES.md) for advanced usage
4. 🛠️ See [SETUP.md](SETUP.md) for advanced configuration

## Getting Help

- Check [README.md](README.md) for detailed documentation
- Review [EXAMPLES.md](EXAMPLES.md) for usage examples
- Open an issue on GitHub for bugs
- Check existing issues for solutions

## Example Workflow

### Building a Personal Knowledge Base

**Step 1: Ingest your documents**
```
Ingest all PDFs from ~/Documents/Research/
```

**Step 2: Organize with tags**
```
Update document doc_123 with tags machine-learning, research, 2024
```

**Step 3: Search and discover**
```
Search for neural network optimization techniques
```

**Step 4: Review and refine**
```
List all documents tagged with research
Get collection statistics
```

### Research Assistant

**Step 1: Ingest papers**
```
Batch ingest all PDF files from ~/Downloads/Papers/ with tags research
```

**Step 2: Ask questions**
```
What are the key findings about transformer models in my research papers?
```

**Step 3: Get relevant passages**
```
Search for attention mechanism with max results 10
```

**Step 4: Track progress**
```
Show me all documents tagged with research from 2024
```

## Success!

You're now ready to use Knowledge Management MCP! Start by ingesting some documents and exploring the search capabilities.

Happy knowledge managing! 📚🔍✨

