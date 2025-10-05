/**
 * PDF document processor using pdfjs-dist
 */

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
      
      // Use pdfjs-dist for more reliable PDF processing
      const pdfjsLib = await import('pdfjs-dist');
      
      // Load the PDF document (convert Buffer to Uint8Array)
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(dataBuffer),
        useSystemFonts: true,
      });
      
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      if (!fullText || fullText.trim().length === 0) {
        throw new Error('PDF contains no extractable text');
      }

      logger.info(`Successfully extracted ${fullText.length} characters from PDF`);
      return fullText.trim();
    } catch (error: any) {
      logger.error(`Failed to process PDF: ${error.message}`);
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }
}

