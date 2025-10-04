/**
 * DOCX document processor
 */

import mammoth from 'mammoth';
import { FileProcessor } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class DocxProcessor implements FileProcessor {
  canProcess(fileType: string): boolean {
    return fileType.toLowerCase() === 'docx';
  }

  async process(filePath: string): Promise<string> {
    try {
      logger.debug(`Processing DOCX file: ${filePath}`);
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('DOCX contains no extractable text');
      }

      if (result.messages.length > 0) {
        logger.warn(`DOCX processing warnings:`, result.messages);
      }

      logger.info(`Successfully extracted ${result.value.length} characters from DOCX`);
      return result.value;
    } catch (error: any) {
      logger.error(`Failed to process DOCX: ${error.message}`);
      throw new Error(`DOCX processing failed: ${error.message}`);
    }
  }
}

