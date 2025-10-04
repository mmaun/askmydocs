# Usage Examples

## Example 1: Ingesting a PDF Research Paper

**User**: "Can you ingest this research paper for me?"

**Claude uses tool**:
```json
{
  "tool": "ingest_document",
  "arguments": {
    "file_path": "/Users/john/Documents/ml-research-2024.pdf",
    "tags": ["research", "machine-learning", "2024"],
    "metadata": {
      "author": "Dr. Smith",
      "institution": "MIT",
      "year": 2024
    }
  }
}
```

**Result**:
```json
{
  "documentId": "doc_1704467890_a1b2c3d4",
  "chunksCreated": 25,
  "status": "success",
  "message": "Document ingested successfully with 25 chunks"
}
```

## Example 2: Semantic Search

**User**: "Search for information about neural network architectures in my documents"

**Claude uses tool**:
```json
{
  "tool": "search_knowledge",
  "arguments": {
    "query": "neural network architectures and their applications",
    "max_results": 5,
    "similarity_threshold": 0.7
  }
}
```

**Result**:
```json
{
  "results": [
    {
      "content": "Convolutional Neural Networks (CNNs) are particularly effective for image processing tasks. They use specialized layers that can detect features hierarchically...",
      "source": "ml-research-2024.pdf",
      "score": 0.89,
      "metadata": {
        "document_id": "doc_1704467890_a1b2c3d4",
        "file_type": "pdf",
        "tags": ["research", "machine-learning", "2024"],
        "author": "Dr. Smith"
      },
      "chunk_index": 7
    },
    {
      "content": "Transformer architectures have revolutionized natural language processing. The attention mechanism allows the model to weigh the importance of different input tokens...",
      "source": "ml-research-2024.pdf",
      "score": 0.85,
      "metadata": {
        "document_id": "doc_1704467890_a1b2c3d4",
        "file_type": "pdf",
        "tags": ["research", "machine-learning", "2024"]
      },
      "chunk_index": 12
    }
  ],
  "total_results": 5
}
```

## Example 3: Batch Ingesting a Documentation Folder

**User**: "Ingest all markdown files from my project documentation folder"

**Claude uses tool**:
```json
{
  "tool": "batch_ingest",
  "arguments": {
    "directory_path": "/Users/john/Projects/my-app/docs",
    "file_patterns": ["*.md"],
    "recursive": true
  }
}
```

**Result**:
```json
{
  "totalFiles": 15,
  "successCount": 14,
  "failedCount": 1,
  "documents": [
    {
      "documentId": "doc_1704467891_e5f6g7h8",
      "chunksCreated": 10,
      "status": "success"
    },
    ...
  ],
  "errors": [
    {
      "file": "/Users/john/Projects/my-app/docs/broken.md",
      "error": "File is empty"
    }
  ]
}
```

## Example 4: Filtering Search by Tags

**User**: "Find information about API endpoints, but only in my 2024 documentation"

**Claude uses tool**:
```json
{
  "tool": "search_knowledge",
  "arguments": {
    "query": "API endpoints and their usage",
    "max_results": 10,
    "filter_tags": ["documentation", "2024"]
  }
}
```

## Example 5: Ingesting Raw Text

**User**: "Save this note: 'Meeting with client on Jan 15. Discussed new features: dark mode, export to PDF, and mobile app. Budget approved.'"

**Claude uses tool**:
```json
{
  "tool": "ingest_document",
  "arguments": {
    "text_content": "Meeting with client on Jan 15. Discussed new features: dark mode, export to PDF, and mobile app. Budget approved.",
    "tags": ["meeting-notes", "client", "2024"],
    "metadata": {
      "date": "2024-01-15",
      "type": "meeting-notes"
    }
  }
}
```

## Example 6: Listing Documents with Filtering

**User**: "Show me all research papers I've ingested"

**Claude uses tool**:
```json
{
  "tool": "list_documents",
  "arguments": {
    "tags": ["research"],
    "limit": 20
  }
}
```

**Result**:
```json
{
  "documents": [
    {
      "id": "doc_1704467890_a1b2c3d4",
      "filename": "ml-research-2024.pdf",
      "file_type": "pdf",
      "tags": ["research", "machine-learning", "2024"],
      "chunks_count": 25,
      "created_at": "2024-01-05T14:30:00Z",
      "updated_at": "2024-01-05T14:30:00Z"
    },
    {
      "id": "doc_1704467892_i9j0k1l2",
      "filename": "nlp-survey.pdf",
      "file_type": "pdf",
      "tags": ["research", "nlp", "2023"],
      "chunks_count": 32,
      "created_at": "2024-01-03T09:15:00Z",
      "updated_at": "2024-01-03T09:15:00Z"
    }
  ],
  "total": 2
}
```

## Example 7: Getting Full Document Content

**User**: "Show me the full content of document doc_1704467890_a1b2c3d4"

**Claude uses tool**:
```json
{
  "tool": "get_document",
  "arguments": {
    "document_id": "doc_1704467890_a1b2c3d4"
  }
}
```

**Result**:
```json
{
  "id": "doc_1704467890_a1b2c3d4",
  "content": "Machine Learning Research 2024\n\nAbstract\nThis paper presents...",
  "filename": "ml-research-2024.pdf",
  "file_type": "pdf",
  "tags": ["research", "machine-learning", "2024"],
  "chunks": [
    {
      "index": 0,
      "content": "Machine Learning Research 2024\n\nAbstract\nThis paper presents new findings...",
      "start_char": 0,
      "end_char": 1000
    },
    ...
  ],
  "created_at": "2024-01-05T14:30:00Z",
  "updated_at": "2024-01-05T14:30:00Z"
}
```

## Example 8: Updating Document Metadata

**User**: "Update the tags for document doc_1704467890_a1b2c3d4 to include 'deep-learning'"

**Claude uses tool**:
```json
{
  "tool": "update_document_metadata",
  "arguments": {
    "document_id": "doc_1704467890_a1b2c3d4",
    "tags": ["research", "machine-learning", "deep-learning", "2024"],
    "metadata": {
      "reviewed": true,
      "review_date": "2024-01-10"
    }
  }
}
```

## Example 9: Getting Knowledge Base Statistics

**User**: "What are the statistics of my knowledge base?"

**Claude uses tool**:
```json
{
  "tool": "get_collection_stats"
}
```

**Result**:
```json
{
  "total_documents": 48,
  "total_chunks": 856,
  "collection_size": 856,
  "average_chunks_per_document": 17.83,
  "file_types": {
    "pdf": 25,
    "md": 15,
    "txt": 5,
    "docx": 3
  }
}
```

## Example 10: Deleting a Document

**User**: "Delete the document doc_1704467890_a1b2c3d4"

**Claude uses tool**:
```json
{
  "tool": "delete_document",
  "arguments": {
    "document_id": "doc_1704467890_a1b2c3d4"
  }
}
```

**Result**:
```json
{
  "success": true,
  "message": "Document doc_1704467890_a1b2c3d4 deleted successfully"
}
```

## Example 11: Complex Search with Filters

**User**: "Find all mentions of 'transformer models' in my research papers from 2024, show top 3 results"

**Claude uses tool**:
```json
{
  "tool": "search_knowledge",
  "arguments": {
    "query": "transformer models architecture and performance",
    "max_results": 3,
    "similarity_threshold": 0.75,
    "filter_tags": ["research", "2024"]
  }
}
```

## Example 12: Ingesting CSV Data

**User**: "Ingest this sales data CSV file"

**Claude uses tool**:
```json
{
  "tool": "ingest_document",
  "arguments": {
    "file_path": "/Users/john/Data/sales-q4-2024.csv",
    "tags": ["sales", "data", "q4", "2024"],
    "metadata": {
      "quarter": "Q4",
      "year": 2024,
      "department": "Sales"
    }
  }
}
```

**The CSV content** is converted to text format:
```
Row 1: Product: Widget A, Units: 150, Revenue: 15000
Row 2: Product: Widget B, Units: 200, Revenue: 25000
...
```

## Example 13: Ingesting HTML Documentation

**User**: "Ingest this API documentation page"

**Claude uses tool**:
```json
{
  "tool": "ingest_document",
  "arguments": {
    "file_path": "/Users/john/Downloads/api-docs.html",
    "tags": ["documentation", "api", "reference"],
    "metadata": {
      "source": "official-docs",
      "version": "v2.0"
    }
  }
}
```

## Example 14: Multi-Step Workflow

**User**: "Ingest all PDFs from my research folder, then search for 'quantum computing'"

**Claude performs multiple tools**:

1. **Batch Ingest**:
```json
{
  "tool": "batch_ingest",
  "arguments": {
    "directory_path": "/Users/john/Research",
    "file_patterns": ["*.pdf"],
    "recursive": true
  }
}
```

2. **Search**:
```json
{
  "tool": "search_knowledge",
  "arguments": {
    "query": "quantum computing applications and algorithms",
    "max_results": 5
  }
}
```

## Example 15: Working with JSON Configuration Files

**User**: "Ingest this configuration file"

**Claude uses tool**:
```json
{
  "tool": "ingest_document",
  "arguments": {
    "file_path": "/Users/john/Projects/app/config.json",
    "tags": ["configuration", "settings", "production"],
    "metadata": {
      "environment": "production",
      "service": "api-gateway"
    }
  }
}
```

**JSON is converted** to searchable text:
```
app.name: My Application
app.version: 2.0.1
database.host: localhost
database.port: 5432
...
```

## Best Practices

### 1. Use Descriptive Tags
```json
{
  "tags": ["research", "machine-learning", "2024", "reviewed"]
}
```

### 2. Add Rich Metadata
```json
{
  "metadata": {
    "author": "John Doe",
    "date": "2024-01-15",
    "project": "ML Research",
    "status": "published",
    "priority": "high"
  }
}
```

### 3. Use Specific Queries
❌ Bad: "machine learning"
✅ Good: "machine learning model architectures for image classification"

### 4. Set Appropriate Thresholds
- **High precision**: threshold 0.8+
- **Balanced**: threshold 0.6-0.8
- **High recall**: threshold 0.0-0.5

### 5. Organize with Tags
```json
{
  "tags": [
    "category:research",
    "year:2024",
    "status:active",
    "priority:high"
  ]
}
```

