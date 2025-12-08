/**
 * Resource Manager - MCP Resource Management
 *
 * Manages database resources for MCP protocol access
 */

import type { ConnectionManager } from '../utils/connection.js';

export interface ResourceInfo {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface ResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}

export class ResourceManager {
  constructor(private connectionManager: ConnectionManager) {}

  /**
   * List available database resources
   */
  async listResources(): Promise<ResourceInfo[]> {
    try {
      // Get available schemas
      const schemasQuery = `
        SELECT DISTINCT table_schema
        FROM information_schema.tables
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY table_schema
      `;

      const schemas = await this.connectionManager.query(schemasQuery);
      const resources: ResourceInfo[] = [];

      // Add schema resources
      for (const schema of schemas) {
        resources.push({
          uri: `postgres://${schema.table_schema}`,
          name: `Schema: ${schema.table_schema}`,
          description: `Database schema containing tables and views`,
          mimeType: 'application/json',
        });
      }

      // Get table resources
      const tablesQuery = `
        SELECT
          table_schema,
          table_name,
          table_type,
          obj_description(pg_class.oid) as comment
        FROM information_schema.tables
        LEFT JOIN pg_class ON pg_class.relname = table_name
        LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
          AND pg_namespace.nspname = table_schema
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY table_schema, table_name
      `;

      const tables = await this.connectionManager.query(tablesQuery);

      // Add table resources
      for (const table of tables) {
        const description = table.comment ||
          `${table.table_type.toLowerCase()} in ${table.table_schema} schema`;

        resources.push({
          uri: `postgres://${table.table_schema}.${table.table_name}`,
          name: `Table: ${table.table_schema}.${table.table_name}`,
          description,
          mimeType: 'application/json',
        });
      }

      // Add database statistics resource
      resources.push({
        uri: 'postgres://stats',
        name: 'Database Statistics',
        description: 'General database statistics and information',
        mimeType: 'application/json',
      });

      return resources;
    } catch (error) {
      console.error('[ERROR] Failed to list resources:', error.message);
      return [];
    }
  }

  /**
   * Read resource content
   */
  async readResource(uri: string): Promise<ResourceContent> {
    try {
      // Parse the URI to determine what resource to read
      const parsedUri = this.parseUri(uri);

      switch (parsedUri.type) {
        case 'schema':
          return await this.getSchemaContent(parsedUri.schema!);

        case 'table':
          return await this.getTableContent(parsedUri.schema!, parsedUri.table!);

        case 'stats':
          return await this.getDatabaseStats();

        default:
          throw new Error(`Unknown resource URI format: ${uri}`);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to read resource ${uri}:`, error.message);
      throw new Error(`Failed to read resource ${uri}: ${error.message}`);
    }
  }

  /**
   * Parse resource URI
   */
  private parseUri(uri: string): { type: string; schema?: string; table?: string } {
    if (uri.startsWith('postgres://stats')) {
      return { type: 'stats' };
    }

    const match = uri.match(/^postgres:\/\/([^\/]+)\/?([^\/]+)?$/);
    if (!match) {
      throw new Error(`Invalid resource URI format: ${uri}`);
    }

    const schema = match[1];
    const table = match[2];

    if (!table) {
      return { type: 'schema', schema };
    }

    return { type: 'table', schema, table };
  }

  /**
   * Get schema content
   */
  private async getSchemaContent(schema: string): Promise<ResourceContent> {
    const tablesQuery = `
      SELECT
        table_name,
        table_type,
        obj_description(pg_class.oid) as comment
      FROM information_schema.tables
      LEFT JOIN pg_class ON pg_class.relname = table_name
      LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        AND pg_namespace.nspname = table_schema
      WHERE table_schema = $1
      ORDER BY table_type, table_name
    `;

    const tables = await this.connectionManager.query(tablesQuery, [schema]);

    const content = {
      schema,
      tables,
      table_count: tables.length,
    };

    return {
      uri: `postgres://${schema}`,
      mimeType: 'application/json',
      text: JSON.stringify(content, null, 2),
    };
  }

  /**
   * Get table content
   */
  private async getTableContent(schema: string, table: string): Promise<ResourceContent> {
    // Get table structure
    const structureQuery = `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        col_description(pg_class.oid, ordinal_position) as description
      FROM information_schema.columns
      LEFT JOIN pg_class ON pg_class.relname = table_name
      LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        AND pg_namespace.nspname = table_schema
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `;

    // Get row count (sample for large tables)
    const countQuery = `
      SELECT COUNT(*) as row_count
      FROM information_schema.tables
      WHERE table_schema = $1 AND table_name = $2
    `;

    // Get sample data
    const sampleQuery = `
      SELECT *
      FROM ${this.escapeIdentifier(schema)}.${this.escapeIdentifier(table)}
      LIMIT 5
    `;

    const [columns, countInfo, sampleData] = await Promise.all([
      this.connectionManager.query(structureQuery, [schema, table]),
      this.connectionManager.query(countQuery, [schema, table]),
      this.connectionManager.query(sampleQuery),
    ]);

    const content = {
      schema,
      table,
      columns,
      sample_data: sampleData,
      total_rows: countInfo[0]?.row_count || 0,
    };

    return {
      uri: `postgres://${schema}.${table}`,
      mimeType: 'application/json',
      text: JSON.stringify(content, null, 2),
    };
  }

  /**
   * Get database statistics
   */
  private async getDatabaseStats(): Promise<ResourceContent> {
    const queries = {
      version: 'SELECT version() as version',
      size: `
        SELECT
          pg_database_size(current_database()) as database_size_bytes,
          pg_size_pretty(pg_database_size(current_database())) as database_size
      `,
      connections: 'SELECT count(*) as active_connections FROM pg_stat_activity',
      tables: `
        SELECT
          count(*) as total_tables,
          count(*) FILTER (WHERE table_type = 'BASE TABLE') as tables,
          count(*) FILTER (WHERE table_type = 'VIEW') as views
        FROM information_schema.tables
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      `,
    };

    const [version, size, connections, tables] = await Promise.all([
      this.connectionManager.query(queries.version),
      this.connectionManager.query(queries.size),
      this.connectionManager.query(queries.connections),
      this.connectionManager.query(queries.tables),
    ]);

    const content = {
      database: {
        version: version[0].version,
        size: size[0],
        connections: connections[0].active_connections,
        tables: tables[0],
      },
      generated_at: new Date().toISOString(),
    };

    return {
      uri: 'postgres://stats',
      mimeType: 'application/json',
      text: JSON.stringify(content, null, 2),
    };
  }

  /**
   * Escape identifier to prevent SQL injection
   */
  private escapeIdentifier(identifier: string): string {
    return identifier.replace(/"/g, '""');
  }
}