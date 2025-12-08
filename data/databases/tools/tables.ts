/**
 * Tables Tool - Database Table Listing
 *
 * Implements the pg_list_tables tool for listing database tables and schemas
 */

import { z } from 'zod';
import type { ConnectionManager } from '../utils/connection.js';

export const TablesToolSchema = z.object({
  schema: z.string().optional().describe('Schema name filter (optional)'),
  includeSystemTables: z.boolean().optional().default(false).describe('Include system tables (default: false)'),
});

export interface TableInfo {
  table_schema: string;
  table_name: string;
  table_type: string;
  comment?: string;
}

export interface TablesToolResult {
  success: boolean;
  data?: TableInfo[];
  count?: number;
  message: string;
}

export class TablesTool {
  public readonly name = 'pg_list_tables';
  public readonly description = 'List all tables in the database with optional schema filtering';
  public readonly inputSchema = z.object({
    schema: z.string().optional().describe('Optional schema name to filter tables'),
    includeSystemTables: z.boolean().optional().default(false).describe('Include system tables in results (default: false)'),
  });

  constructor(private connectionManager: ConnectionManager) {}

  async execute(args: unknown): Promise<TablesToolResult> {
    try {
      const { schema, includeSystemTables = false } = TablesToolSchema.parse(args);

      // Build the query
      let query = `
        SELECT
          t.table_schema,
          t.table_name,
          t.table_type,
          obj_description(c.oid) as comment
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
        WHERE t.table_type IN ('BASE TABLE', 'VIEW', 'MATERIALIZED VIEW')
      `;

      const params: any[] = [];

      // Add schema filter if provided
      if (schema) {
        query += ' AND t.table_schema = $1';
        params.push(schema);
      }

      // Exclude system schemas unless explicitly requested
      if (!includeSystemTables) {
        const systemSchemas = ['information_schema', 'pg_catalog', 'pg_toast'];
        if (params.length === 0) {
          query += ' AND t.table_schema NOT IN ($1, $2, $3)';
          params.push(...systemSchemas);
        } else {
          query += ' AND t.table_schema NOT IN ($2, $3, $4)';
          params.push(...systemSchemas);
        }
      }

      query += ' ORDER BY t.table_schema, t.table_name';

      // Execute query
      const result = await this.connectionManager.query(query, params);

      return {
        success: true,
        data: result || [],
        count: (result || []).length,
        message: `Found ${(result || []).length} tables${schema ? ` in schema '${schema}'` : ''}`,
      };

    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          message: `Invalid input: ${error.errors.map(e => e.message).join(', ')}`,
        };
      }

      return {
        success: false,
        message: `Failed to list tables: ${error.message}`,
      };
    }
  }
}