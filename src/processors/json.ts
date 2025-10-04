/**
 * JSON document processor
 */

import * as fs from 'fs/promises';
import { FileProcessor } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class JsonProcessor implements FileProcessor {
  canProcess(fileType: string): boolean {
    return fileType.toLowerCase() === 'json';
  }

  async process(filePath: string): Promise<string> {
    try {
      logger.debug(`Processing JSON file: ${filePath}`);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Validate JSON
      const data = JSON.parse(content);
      
      // Convert JSON to readable text format
      const text = this.jsonToText(data);

      logger.info(`Successfully processed JSON file`);
      return text;
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        logger.error(`Invalid JSON: ${error.message}`);
        throw new Error(`Invalid JSON file: ${error.message}`);
      }
      logger.error(`Failed to process JSON: ${error.message}`);
      throw new Error(`JSON processing failed: ${error.message}`);
    }
  }

  private jsonToText(data: any, prefix: string = ''): string {
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      return `${prefix}${data}`;
    }

    if (data === null) {
      return `${prefix}null`;
    }

    if (Array.isArray(data)) {
      return data.map((item, index) => 
        this.jsonToText(item, `${prefix}[${index}] `)
      ).join('\n');
    }

    if (typeof data === 'object') {
      return Object.entries(data)
        .map(([key, value]) => {
          const newPrefix = prefix ? `${prefix}.${key}` : key;
          if (typeof value === 'object' && value !== null) {
            return `${newPrefix}:\n${this.jsonToText(value, newPrefix)}`;
          }
          return `${newPrefix}: ${value}`;
        })
        .join('\n');
    }

    return String(data);
  }
}

