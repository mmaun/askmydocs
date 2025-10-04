#!/usr/bin/env node

/**
 * Example script showing how to use fast ingestion
 * This demonstrates the speed difference vs MCP ingestion
 */

import { batchIngest } from '../dist/cli/batch-ingest.js';
import * as fs from 'fs/promises';
import * as path from 'path';

async function createTestDocuments() {
  const testDir = './test-docs';
  await fs.mkdir(testDir, { recursive: true });
  
  // Create some test documents
  const documents = [
    { name: 'document1.txt', content: 'This is the first test document. It contains some sample text for testing the fast ingestion system.' },
    { name: 'document2.txt', content: 'This is the second test document. It has different content to demonstrate batch processing capabilities.' },
    { name: 'document3.txt', content: 'This is the third test document. It shows how multiple files can be processed in parallel for faster ingestion.' },
    { name: 'document4.txt', content: 'This is the fourth test document. It demonstrates the performance improvements over MCP-based ingestion.' },
    { name: 'document5.txt', content: 'This is the fifth test document. It completes our test set for demonstrating fast batch processing.' },
  ];
  
  for (const doc of documents) {
    await fs.writeFile(path.join(testDir, doc.name), doc.content);
  }
  
  console.log(`✅ Created ${documents.length} test documents in ${testDir}`);
  return documents.map(doc => path.join(testDir, doc.name));
}

async function runFastIngestionExample() {
  console.log('🚀 Fast Ingestion Example\n');
  
  // Create test documents
  const files = await createTestDocuments();
  
  console.log('📊 Starting fast batch ingestion...\n');
  
  const startTime = Date.now();
  
  // Run fast batch ingestion
  await batchIngest(files, {
    parallel: 3,
    chunkSize: 100,
    strategy: 'sentence',
    provider: 'transformers',
    tags: ['test', 'example', 'fast-ingestion'],
    metadata: { source: 'example-script', version: '1.0' }
  });
  
  const duration = (Date.now() - startTime) / 1000;
  
  console.log(`\n🎉 Fast ingestion completed in ${duration.toFixed(2)} seconds!`);
  console.log(`📈 That's approximately ${(files.length / duration).toFixed(2)} files per second`);
  
  // Cleanup
  console.log('\n🧹 Cleaning up test documents...');
  for (const file of files) {
    await fs.unlink(file);
  }
  await fs.rmdir('./test-docs');
  console.log('✅ Cleanup complete');
}

// Run the example
runFastIngestionExample().catch(console.error);
