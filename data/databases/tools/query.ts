/**
 * Query Tool - SQL Query Execution
 *
 * Implements the pg_query tool for executing SQL queries with security validation
 */

import { z } from 'zod';
import type { ConnectionManager } from '../utils/connection.js';
import type { SecurityValidator } from '../utils/security.js';

export const QueryToolSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  parameters: z.array(z.any()).optional(),
  limit: z.number().int().min(1).max(1000).optional().default(100),
});

export interface QueryToolResult {
  success: boolean;
  data?: any[];
  rowCount?: number;
  message: string;
  executionTime?: number;
}

export class QueryTool {
  public readonly name = 'pg_query';
  public readonly description = 'Execute SQL queries with security validation and parameter support';
  public readonly inputSchema = z.object({
    query: z.string().min(1, 'SQL query is required'),
    parameters: z.array(z.any()).optional().describe('Optional parameters for parameterized queries'),
    limit: z.number().int().min(1).max(1000).optional().default(100).describe('Maximum number of rows to return (default: 100, max: 1000)'),
  });

  constructor(
    private connectionManager: ConnectionManager,
    private securityValidator: SecurityValidator
  ) {}

  async execute(args: unknown): Promise<QueryToolResult> {
    const startTime = Date.now();

    try {
      const { query, parameters = [], limit } = QueryToolSchema.parse(args);

      // Security validation
      const securityCheck = this.securityValidator.validateQuery(query);
      if (!securityCheck.isValid) {
        return {
          success: false,
          message: `Security validation failed: ${securityCheck.reason}`,
        };
      }

      // Modify query to add LIMIT if not present
      let finalQuery = query.trim();
      const queryLower = finalQuery.toLowerCase();

      // Only add LIMIT for SELECT queries that don't already have a LIMIT clause
      if (queryLower.startsWith('select') && !queryLower.includes('limit')) {
        finalQuery += ` LIMIT ${limit}`;
      }

      // Execute query
      const result = await this.connectionManager.query(finalQuery, parameters);

      const executionTime = Date.now() - startTime;
      const rowCount = Array.isArray(result) ? result.length : 0;

      return {
        success: true,
        data: result,
        rowCount,
        message: `Query executed successfully. Returned ${rowCount} rows in ${executionTime}ms`,
        executionTime,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      if (error instanceof z.ZodError) {
        return {
          success: false,
          message: `Invalid input: ${error.errors.map(e => e.message).join(', ')}`,
        };
      }

      // Handle database errors
      if (error.code) {
        return {
          success: false,
          message: `Database error (${error.code}): ${error.message}`,
        };
      }

      return {
        success: false,
        message: `Query execution failed: ${error.message}`,
        executionTime,
      };
    }
  }
}