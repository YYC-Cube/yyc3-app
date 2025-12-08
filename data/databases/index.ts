#!/usr/bin/env bun

/**
 * PostgreSQL MCP Server - Complete Implementation
 *
 * A comprehensive Model Context Protocol server for secure PostgreSQL database access
 * through AI development tools like Cursor, Claude Code, and other MCP-compatible platforms.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import postgres from 'postgres';
import { z } from 'zod';

// Import our modules
import { DatabaseConfig, loadConfig } from './config/database.js';
import { SecurityConfig } from './config/security.js';
import { PerformanceConfig } from './config/performance.js';
import { QueryTool } from './tools/query.js';
import { TablesTool } from './tools/tables.js';
import { DescribeTool } from './tools/describe.js';
import { ResourceManager } from './resources/resource-manager.js';
import { ConnectionManager } from './utils/connection.js';
import { SecurityValidator } from './utils/security.js';
import { Logger } from './utils/logger.js';

class PostgreSQLMCPServer {
  private server: Server;
  private connectionManager: ConnectionManager;
  private resourceManager: ResourceManager;
  private securityValidator: SecurityValidator;
  private logger: Logger;
  private tools: Map<string, any>;

  constructor() {
    // Load configuration
    const config = loadConfig();

    // Initialize logging
    this.logger = new Logger({
      level: process.env.LOG_LEVEL || 'info',
      structured: process.env.STRUCTURED_LOGGING === 'true'
    });

    this.logger.info('Initializing PostgreSQL MCP Server', {
      version: '1.0.0',
      database: config.databaseUrl ? 'configured' : 'not configured'
    });

    // Initialize components
    this.server = new Server(
      {
        name: 'postgresql-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.connectionManager = new ConnectionManager(config);
    this.securityValidator = new SecurityValidator(config.security);
    this.resourceManager = new ResourceManager(this.connectionManager);

    // Initialize tools
    this.initializeTools();

    // Setup handlers
    this.setupHandlers();

    // Setup error handling
    this.setupErrorHandling();

    this.logger.info('PostgreSQL MCP Server initialized successfully');
  }

  private initializeTools(): void {
    this.tools = new Map([
      ['pg_query', new QueryTool(this.connectionManager, this.securityValidator)],
      ['pg_list_tables', new TablesTool(this.connectionManager)],
      ['pg_describe_table', new DescribeTool(this.connectionManager)],
    ]);

    this.logger.debug('Tools initialized', {
      tools: Array.from(this.tools.keys())
    });
  }

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.tools.entries()).map(([name, tool]) => ({
        name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      this.logger.debug('Providing tools list', { count: tools.length });
      return { tools };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      this.logger.info('Tool called', { name, args });

      try {
        if (!this.tools.has(name)) {
          throw new Error(`Unknown tool: ${name}`);
        }

        const tool = this.tools.get(name);
        const result = await tool.execute(args);

        this.logger.info('Tool executed successfully', { name });

        return {
          content: [
            {
              type: 'text',
              text: result.message || 'Operation completed successfully',
            },
            ...(result.data ? [{
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            }] : []),
          ],
        };
      } catch (error) {
        this.logger.error('Tool execution failed', { name, error: error.message, stack: error.stack });

        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const resources = await this.resourceManager.listResources();

        this.logger.debug('Providing resources list', { count: resources.length });

        return { resources };
      } catch (error) {
        this.logger.error('Failed to list resources', { error: error.message });

        return {
          resources: []
        };
      }
    });

    // Read resource handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      this.logger.debug('Reading resource', { uri });

      try {
        const content = await this.resourceManager.readResource(uri);

        this.logger.info('Resource read successfully', { uri });

        return { contents: [content] };
      } catch (error) {
        this.logger.error('Failed to read resource', { uri, error: error.message });

        throw new Error(`Failed to read resource ${uri}: ${error.message}`);
      }
    });
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      this.logger.error('MCP Server error', { error: error.message, stack: error.stack });
    };

    process.on('SIGINT', async () => {
      this.logger.info('Shutting down PostgreSQL MCP Server');

      try {
        await this.connectionManager.close();
        await this.server.close();
        this.logger.info('Server shutdown complete');
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Promise Rejection', { reason, promise });
      process.exit(1);
    });

    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  }

  async run(): Promise<void> {
    try {
      // Test database connection
      await this.connectionManager.testConnection();

      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      this.logger.info('PostgreSQL MCP Server running on stdio');
    } catch (error) {
      this.logger.error('Failed to start server', { error: error.message });
      throw error;
    }
  }
}

// Start the server
const server = new PostgreSQLMCPServer();
server.run().catch((error) => {
  console.error('Failed to start PostgreSQL MCP Server:', error);
  process.exit(1);
});