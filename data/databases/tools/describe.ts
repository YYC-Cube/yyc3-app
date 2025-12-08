/**
 * Describe Tool - Table Structure Description
 *
 * Implements the pg_describe_table tool for detailed table structure analysis
 */

import { z } from 'zod';
import type { ConnectionManager } from '../utils/connection.js';

export const DescribeToolSchema = z.object({
  table: z.string().min(1, 'Table name is required'),
  schema: z.string().optional().default('public').describe('Schema name (default: public)'),
});

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string;
  character_maximum_length?: number;
  numeric_precision?: number;
  numeric_scale?: number;
  ordinal_position: number;
  description?: string;
}

export interface ConstraintInfo {
  constraint_name: string;
  constraint_type: string;
  column_names: string[];
  foreign_table?: string;
  foreign_columns?: string[];
  check_condition?: string;
}

export interface IndexInfo {
  index_name: string;
  index_type: string;
  columns: string[];
  is_unique: boolean;
  is_primary_key: boolean;
}

export interface TableDescription {
  table_schema: string;
  table_name: string;
  table_type: string;
  description?: string;
  row_count?: number;
  columns: ColumnInfo[];
  constraints: ConstraintInfo[];
  indexes: IndexInfo[];
}

export interface DescribeToolResult {
  success: boolean;
  data?: TableDescription;
  message: string;
}

export class DescribeTool {
  public readonly name = 'pg_describe_table';
  public readonly description = 'Get detailed information about table structure including columns, constraints, and indexes';
  public readonly inputSchema = z.object({
    table: z.string().min(1, 'Table name is required'),
    schema: z.string().optional().default('public').describe('Schema name (default: public)'),
  });

  constructor(private connectionManager: ConnectionManager) {}

  async execute(args: unknown): Promise<DescribeToolResult> {
    try {
      const { table, schema = 'public' } = DescribeToolSchema.parse(args);

      // Get table basic info
      const tableInfoQuery = `
        SELECT
          t.table_schema,
          t.table_name,
          t.table_type,
          obj_description(c.oid) as description,
          COALESCE(s.n_tup_ins + s.n_tup_upd + s.n_tup_del, 0) as row_count
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
        LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name AND s.schemaname = t.table_schema
        WHERE t.table_schema = $1 AND t.table_name = $2
      `;

      const tableInfo = await this.connectionManager.query(tableInfoQuery, [schema, table]);

      if (!tableInfo || tableInfo.length === 0) {
        return {
          success: false,
          message: `Table '${schema}.${table}' not found`,
        };
      }

      // Get column information
      const columnsQuery = `
        SELECT
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.character_maximum_length,
          c.numeric_precision,
          c.numeric_scale,
          c.ordinal_position,
          col_description(pgc.oid, c.ordinal_position) as description
        FROM information_schema.columns c
        LEFT JOIN pg_class pgc ON pgc.relname = c.table_name
        LEFT JOIN pg_namespace pgns ON pgns.oid = pgc.relnamespace AND pgns.nspname = c.table_schema
        WHERE c.table_schema = $1 AND c.table_name = $2
        ORDER BY c.ordinal_position
      `;

      const columns = await this.connectionManager.query(columnsQuery, [schema, table]);

      // Get constraints information
      const constraintsQuery = `
        SELECT
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.update_rule,
          rc.delete_rule
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        LEFT JOIN information_schema.referential_constraints rc
          ON tc.constraint_name = rc.constraint_name
          AND tc.table_schema = rc.constraint_schema
        WHERE tc.table_schema = $1 AND tc.table_name = $2
        ORDER BY tc.constraint_name, kcu.ordinal_position
      `;

      const constraints = await this.connectionManager.query(constraintsQuery, [schema, table]);

      // Group constraints by name and combine column names
      const groupedConstraints = this.groupConstraints(constraints);

      // Get indexes information
      const indexesQuery = `
        SELECT
          i.relname as index_name,
          am.amname as index_type,
          array_agg(a.attname ORDER BY c.ordinality) as columns,
          ix.indisunique as is_unique,
          ix.indisprimary as is_primary_key
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_am am ON i.relam = am.oid
        JOIN unnest(ix.indkey) WITH ORDINALITY c(colnum, ordinality)
          ON c.colnum = ANY(ix.indkey)
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = c.colnum
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = $1 AND t.relname = $2
        GROUP BY i.relname, am.amname, ix.indisunique, ix.indisprimary
        ORDER BY i.relname
      `;

      const indexes = await this.connectionManager.query(indexesQuery, [schema, table]);

      const description: TableDescription = {
        table_schema: tableInfo[0].table_schema,
        table_name: tableInfo[0].table_name,
        table_type: tableInfo[0].table_type,
        description: tableInfo[0].description,
        row_count: tableInfo[0].row_count,
        columns: columns || [],
        constraints: groupedConstraints,
        indexes: indexes || [],
      };

      return {
        success: true,
        data: description,
        message: `Successfully described table '${schema}.${table}' with ${columns.length} columns`,
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
        message: `Failed to describe table: ${error.message}`,
      };
    }
  }

  private groupConstraints(constraints: any[]): ConstraintInfo[] {
    const constraintMap = new Map<string, ConstraintInfo>();

    for (const row of constraints) {
      if (!constraintMap.has(row.constraint_name)) {
        constraintMap.set(row.constraint_name, {
          constraint_name: row.constraint_name,
          constraint_type: row.constraint_type,
          column_names: [],
          foreign_table: row.foreign_table_name,
          foreign_columns: [],
          check_condition: undefined,
        });
      }

      const constraint = constraintMap.get(row.constraint_name)!;
      constraint.column_names.push(row.column_name);

      if (row.foreign_column_name && !constraint.foreign_columns.includes(row.foreign_column_name)) {
        constraint.foreign_columns.push(row.foreign_column_name);
      }
    }

    return Array.from(constraintMap.values());
  }
}