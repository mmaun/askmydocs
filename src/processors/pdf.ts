/**
 * PDF document processor
 */

import pdfParse from 'pdf-parse';
import * as fs from 'fs/promises';
import { FileProcessor } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class PdfProcessor implements FileProcessor {
  canProcess(fileType: string): boolean {
    return fileType.toLowerCase() === 'pdf';
  }

  async process(filePath: string): Promise<string> {
    try {
      logger.debug(`Processing PDF file: ${filePath}`);
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF contains no extractable text');
      }

      logger.info(`Successfully extracted ${data.text.length} characters from PDF`);
      return data.text;
    } catch (error: any) {
      logger.error(`Failed to process PDF: ${error.message}`);
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }
}

