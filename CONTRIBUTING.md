# Contributing to Knowledge Management MCP

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/knowledge-mgmt-mcp.git
   cd knowledge-mgmt-mcp
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Build the project**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── index.ts              # Entry point
├── server.ts             # MCP server setup
├── types/                # TypeScript interfaces
├── utils/                # Utilities (config, logger, validation)
├── processors/           # File processors (PDF, DOCX, etc.)
├── chunking/             # Chunking strategies
├── embeddings/           # Embedding providers
├── storage/              # Storage backends
└── tools/                # MCP tool implementations
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define interfaces for all data structures
- Use async/await for asynchronous operations
- Add JSDoc comments for public APIs

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase`

### Example

```typescript
/**
 * Process a document file and extract text content
 * @param filePath - Path to the document file
 * @returns Extracted text content
 */
export async function processDocument(filePath: string): Promise<string> {
  validateFilePath(filePath);
  const processor = getProcessor(filePath);
  return await processor.process(filePath);
}
```

## Adding New Features

### Adding a New File Processor

1. Create a new file in `src/processors/`
   ```typescript
   // src/processors/pptx.ts
   import { FileProcessor } from '../types/index.js';
   
   export class PptxProcessor implements FileProcessor {
     canProcess(fileType: string): boolean {
       return fileType.toLowerCase() === 'pptx';
     }
     
     async process(filePath: string): Promise<string> {
       // Implementation
     }
   }
   ```

2. Register in `src/processors/index.ts`
   ```typescript
   import { PptxProcessor } from './pptx.js';
   
   const processors = [
     // ... existing processors
     new PptxProcessor(),
   ];
   ```

3. Update allowed file types in config
4. Add tests
5. Update documentation

### Adding a New Embedding Provider

1. Create a new file in `src/embeddings/`
   ```typescript
   // src/embeddings/custom.ts
   import { EmbeddingProvider } from '../types/index.js';
   
   export class CustomEmbedding implements EmbeddingProvider {
     async generateEmbedding(text: string): Promise<number[]> {
       // Implementation
     }
     
     async generateEmbeddings(texts: string[]): Promise<number[][]> {
       // Implementation
     }
     
     getDimensions(): number {
       return 768;
     }
   }
   ```

2. Register in `src/embeddings/index.ts`
3. Update configuration options
4. Add tests
5. Update documentation

### Adding a New Chunking Strategy

1. Create a new file in `src/chunking/`
   ```typescript
   // src/chunking/semantic.ts
   import { ChunkingStrategy } from '../types/index.js';
   
   export class SemanticChunking implements ChunkingStrategy {
     chunk(text: string, options: ChunkingOptions): DocumentChunk[] {
       // Implementation
     }
   }
   ```

2. Register in `src/chunking/index.ts`
3. Add tests
4. Update documentation

## Testing

### Manual Testing

1. Build the project
   ```bash
   npm run build
   ```

2. Link locally
   ```bash
   npm link
   ```

3. Configure Claude Desktop with local path
   ```json
   {
     "command": "node",
     "args": ["/absolute/path/to/dist/index.js"]
   }
   ```

4. Test all tools:
   - Document ingestion (various formats)
   - Search functionality
   - Document management
   - Batch operations

### Test Checklist

- [ ] PDF ingestion works
- [ ] DOCX ingestion works
- [ ] Text file ingestion works
- [ ] Search returns relevant results
- [ ] Tags filtering works
- [ ] Metadata updates work
- [ ] Document deletion works
- [ ] Batch ingestion works
- [ ] Error handling is appropriate
- [ ] Logs are informative

## Pull Request Process

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow coding standards
   - Add tests if applicable
   - Update documentation

3. **Test thoroughly**
   - Build succeeds
   - All features work
   - No regressions

4. **Commit with clear messages**
   ```bash
   git commit -m "Add support for PPTX files"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Describe the changes
   - Reference any related issues
   - Include screenshots if applicable

## Code Review Guidelines

### For Contributors

- Be open to feedback
- Respond to comments promptly
- Make requested changes
- Keep discussions professional

### For Reviewers

- Be constructive and respectful
- Explain the reasoning behind suggestions
- Approve if changes are good
- Request changes if needed

## Documentation

### Update README.md

- Add new features to feature list
- Update configuration options
- Add usage examples

### Update EXAMPLES.md

- Add practical examples for new features
- Show expected input/output

### Add JSDoc Comments

```typescript
/**
 * Description of what the function does
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws {ErrorType} Description of when error is thrown
 */
```

## Issue Reporting

### Bug Reports

Include:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (Node version, OS)
- Logs (with LOG_LEVEL=DEBUG)

### Feature Requests

Include:
- Use case / problem to solve
- Proposed solution
- Alternative solutions considered
- Additional context

## Areas for Contribution

### High Priority

- [ ] Add more file format processors (PPTX, XLSX, etc.)
- [ ] Implement hybrid search (keyword + semantic)
- [ ] Add OCR support for scanned PDFs
- [ ] Improve chunking algorithms
- [ ] Add more embedding providers
- [ ] Performance optimizations

### Medium Priority

- [ ] Add web scraping support
- [ ] Implement document versioning
- [ ] Add export functionality
- [ ] Create web UI for management
- [ ] Add authentication/authorization
- [ ] Implement rate limiting

### Documentation

- [ ] Video tutorials
- [ ] More usage examples
- [ ] API reference
- [ ] Architecture diagrams
- [ ] Performance benchmarks

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions
- Report inappropriate behavior

## Questions?

- Open a GitHub Discussion
- Check existing issues
- Read the documentation
- Ask in pull request comments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing! 🎉

