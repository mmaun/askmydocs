/**
 * CSV document processor
 */

import * as fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { FileProcessor } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class CsvProcessor implements FileProcessor {
  canProcess(fileType: string): boolean {
    return fileType.toLowerCase() === 'csv';
  }

  async process(filePath: string): Promise<string> {
    try {
      logger.debug(`Processing CSV file: ${filePath}`);
      const content = await fs.readFile(filePath, 'utf-8');
      
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (!records || records.length === 0) {
        throw new Error('CSV contains no data');
      }

      // Convert CSV to readable text format
      const text = records.map((record: any, index: number) => {
        const entries = Object.entries(record)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        return `Row ${index + 1}: ${entries}`;
      }).join('\n\n');

      logger.info(`Successfully processed ${records.length} rows from CSV`);
      return text;
    } catch (error: any) {
      logger.error(`Failed to process CSV: ${error.message}`);
      throw new Error(`CSV processing failed: ${error.message}`);
    }
  }
}

