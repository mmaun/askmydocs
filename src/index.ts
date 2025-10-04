#!/usr/bin/env node

/**
 * Knowledge Management MCP Server
 * Entry point for the server
 */

import { KnowledgeManagementServer } from './server.js';
import { loadConfig, validateConfig } from './utils/config.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    // Load and validate configuration
    logger.info('Loading configuration...');
    const config = loadConfig();
    validateConfig(config);

    logger.info('Configuration loaded successfully');
    logger.debug('Config:', JSON.stringify(config, null, 2));

    // Create and start server
    const server = new KnowledgeManagementServer(config);
    await server.start();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });
  } catch (error: any) {
    logger.error(`Fatal error: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

main();

