/**
 * Text document processor (TXT, MD)
 */

import * as fs from 'fs/promises';
import { FileProcessor } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class TextProcessor implements FileProcessor {
  canProcess(fileType: string): boolean {
    const type = fileType.toLowerCase();
    return type === 'txt' || type === 'md' || type === 'markdown';
  }

  async process(filePath: string): Promise<string> {
    try {
      logger.debug(`Processing text file: ${filePath}`);
      const content = await fs.readFile(filePath, 'utf-8');
      
      if (!content || content.trim().length === 0) {
        throw new Error('File is empty');
      }

      logger.info(`Successfully read ${content.length} characters from text file`);
      return content;
    } catch (error: any) {
      logger.error(`Failed to process text file: ${error.message}`);
      throw new Error(`Text file processing failed: ${error.message}`);
    }
  }
}

