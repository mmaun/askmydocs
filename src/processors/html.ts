/**
 * HTML document processor
 */

import * as fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import { FileProcessor } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class HtmlProcessor implements FileProcessor {
  canProcess(fileType: string): boolean {
    const type = fileType.toLowerCase();
    return type === 'html' || type === 'htm';
  }

  async process(filePath: string): Promise<string> {
    try {
      logger.debug(`Processing HTML file: ${filePath}`);
      const content = await fs.readFile(filePath, 'utf-8');
      
      const dom = new JSDOM(content);
      const document = dom.window.document;

      // Remove script and style tags
      const scripts = document.querySelectorAll('script, style');
      scripts.forEach((script: Element) => script.remove());

      // Extract text content
      const text = document.body?.textContent || document.textContent || '';
      
      // Clean up whitespace
      const cleanedText = text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

      if (!cleanedText || cleanedText.length === 0) {
        throw new Error('HTML contains no extractable text');
      }

      logger.info(`Successfully extracted ${cleanedText.length} characters from HTML`);
      return cleanedText;
    } catch (error: any) {
      logger.error(`Failed to process HTML: ${error.message}`);
      throw new Error(`HTML processing failed: ${error.message}`);
    }
  }
}

