/**
 * Document processor factory
 */

import { FileProcessor } from '../types/index.js';
import { PdfProcessor } from './pdf.js';
import { DocxProcessor } from './docx.js';
import { TextProcessor } from './text.js';
import { CsvProcessor } from './csv.js';
import { JsonProcessor } from './json.js';
import { HtmlProcessor } from './html.js';
import * as path from 'path';

const processors: FileProcessor[] = [
  new PdfProcessor(),
  new DocxProcessor(),
  new TextProcessor(),
  new CsvProcessor(),
  new JsonProcessor(),
  new HtmlProcessor(),
];

export function getProcessor(filePath: string): FileProcessor {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  
  const processor = processors.find(p => p.canProcess(ext));
  
  if (!processor) {
    throw new Error(`No processor available for file type: ${ext}`);
  }

  return processor;
}

export async function processFile(filePath: string): Promise<string> {
  const processor = getProcessor(filePath);
  return await processor.process(filePath);
}

export { PdfProcessor, DocxProcessor, TextProcessor, CsvProcessor, JsonProcessor, HtmlProcessor };

