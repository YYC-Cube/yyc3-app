/**
 * Connection Manager - Database Connection Management
 *
 * Manages PostgreSQL connections with connection pooling and error handling
 */

import postgres from 'postgres';
import type { DatabaseConfig, createConnectionOptions } from '../config/database.js';
import { SecurityValidator } from './security.js';

export class ConnectionManager {
  private sql: postgres.Sql | null = null;
  private readonly config: DatabaseConfig;
  private readonly securityValidator: SecurityValidator;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.securityValidator = new SecurityValidator(config.security);
  }

  /**
   * Initialize database connection
   */
  async connect(): Promise<void> {
    try {
      const { createConnectionOptions } = await import('../config/database.js');
      const options = createConnectionOptions(this.config);

      this.sql = postgres(options);

      // Test the connection
      await this.testConnection();

      console.log('[INFO] Database connection established');
    } catch (error) {
      console.error('[ERROR] Failed to connect to database:', error.message);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<void> {
    if (!this.sql) {
      throw new Error('Database not connected');
    }

    try {
      const result = await this.sql`SELECT version() as version, current_database() as database`;
      console.log('[INFO] Connection test successful:', result[0]);
    } catch (error) {
      console.error('[ERROR] Connection test failed:', error.message);
      throw error;
    }
  }

  /**
   * Execute SQL query with parameters
   */
  async query(sql: string, parameters: any[] = []): Promise<any[]> {
    if (!this.sql) {
      throw new Error('Database not connected');
    }

    try {
      const result = await this.sql.unsafe(sql, parameters);

      if (!Array.isArray(result)) {
        // Handle non-SELECT queries (INSERT, UPDATE, DELETE)
        return [{
          affected_rows: result.count || 0,
          query: sql,
          success: true
        }];
      }

      return result;
    } catch (error) {
      console.error('[ERROR] Query execution failed:', {
        sql,
        parameters,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute parameterized query (safer)
   */
  async parameterizedQuery(template: TemplateStringsArray, ...values: any[]): Promise<any[]> {
    if (!this.sql) {
      throw new Error('Database not connected');
    }

    try {
      const result = await this.sql(template, ...values);

      if (!Array.isArray(result)) {
        return [{
          affected_rows: result.count || 0,
          query: template.join('?'),
          success: true
        }];
      }

      return result;
    } catch (error) {
      console.error('[ERROR] Parameterized query execution failed:', {
        query: template.join('?'),
        values,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Begin transaction
   */
  async beginTransaction(): Promise<Transaction> {
    if (!this.sql) {
      throw new Error('Database not connected');
    }

    return new Transaction(this.sql);
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.sql !== null;
  }

  /**
   * Get current configuration (for debugging)
   */
  getConfig(): Omit<DatabaseConfig, 'password'> {
    const { password, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.sql) {
      try {
        await this.sql.end();
        console.log('[INFO] Database connection closed');
      } catch (error) {
        console.error('[ERROR] Error closing database connection:', error.message);
      } finally {
        this.sql = null;
      }
    }
  }
}

/**
 * Transaction helper class
 */
export class Transaction {
  private sql: postgres.Sql | null = null;
  private isActive = false;

  constructor(private connection: postgres.Sql) {
    this.sql = this.connection;
  }

  /**
   * Begin transaction
   */
  async begin(): Promise<void> {
    if (!this.sql || this.isActive) {
      throw new Error('Transaction already active or not initialized');
    }

    try {
      await this.sql`BEGIN`;
      this.isActive = true;
    } catch (error) {
      console.error('[ERROR] Failed to begin transaction:', error.message);
      throw error;
    }
  }

  /**
   * Commit transaction
   */
  async commit(): Promise<void> {
    if (!this.sql || !this.isActive) {
      throw new Error('No active transaction');
    }

    try {
      await this.sql`COMMIT`;
      this.isActive = false;
    } catch (error) {
      console.error('[ERROR] Failed to commit transaction:', error.message);
      await this.rollback();
      throw error;
    }
  }

  /**
   * Rollback transaction
   */
  async rollback(): Promise<void> {
    if (!this.sql || !this.isActive) {
      return;
    }

    try {
      await this.sql`ROLLBACK`;
      this.isActive = false;
    } catch (error) {
      console.error('[ERROR] Failed to rollback transaction:', error.message);
    }
  }

  /**
   * Execute query within transaction
   */
  async query(sql: string, parameters: any[] = []): Promise<any[]> {
    if (!this.sql || !this.isActive) {
      throw new Error('Transaction not active');
    }

    try {
      const result = await this.sql.unsafe(sql, parameters);
      return Array.isArray(result) ? result : [{
        affected_rows: result.count || 0,
        success: true
      }];
    } catch (error) {
      console.error('[ERROR] Transaction query failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if transaction is active
   */
  isTransactionActive(): boolean {
    return this.isActive;
  }
}

export { DatabaseConfig } from '../config/database.js';