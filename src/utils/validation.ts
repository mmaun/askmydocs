/**
 * Input validation utilities
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from './logger.js';

export async function validateFilePath(filePath: string): Promise<void> {
  // Check for directory traversal attempts
  const resolvedPath = path.resolve(filePath);
  if (resolvedPath.includes('..')) {
    throw new Error('Invalid file path: directory traversal detected');
  }

  // Check if file exists
  try {
    const stats = await fs.stat(resolvedPath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

export async function validateFileSize(filePath: string, maxSize: number): Promise<void> {
  const stats = await fs.stat(filePath);
  if (stats.size > maxSize) {
    throw new Error(
      `File size (${stats.size} bytes) exceeds maximum allowed size (${maxSize} bytes)`
    );
  }
}

export function validateFileType(filePath: string, allowedTypes: string[]): void {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  if (!allowedTypes.includes(ext)) {
    throw new Error(
      `File type '${ext}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    );
  }
}

export function validateDocumentId(documentId: string): void {
  if (!documentId || typeof documentId !== 'string') {
    throw new Error('Invalid document ID: must be a non-empty string');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(documentId)) {
    throw new Error('Invalid document ID: can only contain alphanumeric characters, hyphens, and underscores');
  }
}

export function validateSearchQuery(query: string): void {
  if (!query || typeof query !== 'string') {
    throw new Error('Invalid search query: must be a non-empty string');
  }

  if (query.trim().length === 0) {
    throw new Error('Invalid search query: cannot be empty or only whitespace');
  }

  if (query.length > 10000) {
    throw new Error('Invalid search query: exceeds maximum length of 10000 characters');
  }
}

export function validateMetadata(metadata: any): void {
  if (typeof metadata !== 'object' || metadata === null) {
    throw new Error('Invalid metadata: must be a non-null object');
  }

  // Check for reasonable metadata size (prevent abuse)
  const jsonSize = JSON.stringify(metadata).length;
  if (jsonSize > 100000) {
    throw new Error('Invalid metadata: exceeds maximum size of 100KB');
  }
}

export function validateTags(tags: any): string[] {
  if (!Array.isArray(tags)) {
    throw new Error('Invalid tags: must be an array');
  }

  if (!tags.every(tag => typeof tag === 'string')) {
    throw new Error('Invalid tags: all tags must be strings');
  }

  if (tags.length > 100) {
    throw new Error('Invalid tags: cannot exceed 100 tags');
  }

  return tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
}

export async function validateDirectoryPath(dirPath: string): Promise<void> {
  const resolvedPath = path.resolve(dirPath);
  
  try {
    const stats = await fs.stat(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${dirPath}`);
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    throw error;
  }
}

export function sanitizeFilename(filename: string): string {
  // Remove any path separators and dangerous characters
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

