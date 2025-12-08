/**
 * Security Configuration Module
 * Central security settings and validation rules
 */

import { z } from 'zod';

// Security configuration schema
export interface SecurityConfig {
  allowWriteOps: boolean;
  maxQueryRows: number;
  queryTimeout: number;
  dangerousPatterns: RegExp[];
  allowedTables?: string[];
  blockedTables?: string[];
  requireAuthentication: boolean;
  enableQueryValidation: boolean;
  logSecurityEvents: boolean;
}

// Default security settings
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  allowWriteOps: false,
  maxQueryRows: 1000,
  queryTimeout: 30000, // 30 seconds
  dangerousPatterns: [
    // Prevent DROP operations
    /drop\s+(table|database|schema|view|index|function|procedure|trigger)/i,
    /truncate\s+table/i,

    // Prevent DELETE without WHERE clause
    /delete\s+from\s+\w+\s*$/i,
    /delete\s+from\s+\w+\s*;?\s*$/i,

    // Prevent ALTER operations
    /alter\s+(table|database|schema|view|function|procedure|trigger)/i,

    // Prevent system table access
    /information_schema/i,
    /pg_catalog/i,
    /pg_toast/i,

    // Prevent transaction control abuse
    /\bcommit\s*;?\s*$/i,
    /\brollback\s*;?\s*$/i,
    /\bsavepoint\s*;?\s*$/i,

    // Prevent file system access
    /copy\s+from\s+/i,
    /copy\s+to\s+/i,
    /\bpg_\w+\s*;/i, // PostgreSQL-specific commands
  ],
  requireAuthentication: false,
  enableQueryValidation: true,
  logSecurityEvents: true,
};

/**
 * Load and validate security configuration from environment variables
 */
export function loadSecurityConfig(): SecurityConfig {
  const allowWriteOps = process.env.DANGEROUSLY_ALLOW_WRITE_OPS === 'true' ||
                     process.env.DANGEROUSLY_ALLOW_WRITE_OPS === '1';

  const config: SecurityConfig = {
    ...DEFAULT_SECURITY_CONFIG,
    allowWriteOps,
    maxQueryRows: parseInt(process.env.MAX_QUERY_ROWS || '1000', 10),
    queryTimeout: parseInt(process.env.QUERY_TIMEOUT || '30000', 10),
    requireAuthentication: process.env.REQUIRE_AUTHENTICATION === 'true',
    enableQueryValidation: process.env.ENABLE_QUERY_VALIDATION !== 'false',
    logSecurityEvents: process.env.LOG_SECURITY_EVENTS !== 'false',
  };

  // Parse allowed and blocked tables if specified
  if (process.env.ALLOWED_TABLES) {
    config.allowedTables = process.env.ALLOWED_TABLES.split(',').map(table => table.trim());
  }

  if (process.env.BLOCKED_TABLES) {
    config.blockedTables = process.env.BLOCKED_TABLES.split(',').map(table => table.trim());
  }

  validateSecurityConfig(config);
  return config;
}

/**
 * Validate security configuration values
 */
function validateSecurityConfig(config: SecurityConfig): void {
  // Validate query limits
  if (config.maxQueryRows < 1 || config.maxQueryRows > 10000) {
    throw new Error('Maximum query rows must be between 1 and 10000');
  }

  if (config.queryTimeout < 1000 || config.queryTimeout > 300000) {
    throw new Error('Query timeout must be between 1000ms and 300000ms (5 minutes)');
  }

  // Validate table access lists
  if (config.allowedTables) {
    if (config.blockedTables) {
      const conflictingTables = config.allowedTables.filter(table =>
        config.blockedTables.includes(table)
      );
      if (conflictingTables.length > 0) {
        throw new Error(`Tables cannot be both allowed and blocked: ${conflictingTables.join(', ')}`);
      }
    }
  }

  // Validate dangerous patterns
  if (!config.dangerousPatterns || config.dangerousPatterns.length === 0) {
    throw new Error('Dangerous patterns must be defined');
  }
}

/**
 * Security query validator
 */
export class SecurityValidator {
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  /**
   * Validate SQL query for security risks
   */
  validateQuery(query: string): { isValid: boolean; reason?: string } {
    const normalizedQuery = query.trim();

    // Check dangerous patterns
    for (const pattern of this.config.dangerousPatterns) {
      if (pattern.test(normalizedQuery)) {
        if (this.config.logSecurityEvents) {
          console.warn(`[SECURITY] Dangerous pattern detected: ${pattern.source}`, { query });
        }
        return {
          isValid: false,
          reason: `Query contains potentially dangerous pattern: ${pattern.source}`
        };
      }
    }

    // Check for write operations if not allowed
    if (!this.config.allowWriteOps) {
      const writeOps = [
        /insert\s+into/i,
        /update\s+\w+\s+set/i,
        /delete\s+from/i,
        /create\s+(table|index|view|function|procedure|trigger|schema|database)/i,
        /alter\s+(table|index|view|function|procedure|trigger)/i,
        /truncate\s+table/i,
      ];

      for (const pattern of writeOps) {
        if (pattern.test(normalizedQuery)) {
          if (this.config.logSecurityEvents) {
            console.warn(`[SECURITY] Write operation blocked: ${pattern.source}`, { query });
          }
          return {
            isValid: false,
            reason: 'Write operations are disabled. Set DANGEROUSLY_ALLOW_WRITE_OPS=true to enable.'
          };
        }
      }
    }

    // Check table access permissions
    if (this.config.allowedTables || this.config.blockedTables) {
      const tables = this.extractTableNames(normalizedQuery);
      for (const table of tables) {
        if (this.config.blockedTables?.includes(table)) {
          return {
            isValid: false,
            reason: `Access to table '${table}' is blocked`
          };
        }
        if (this.config.allowedTables && !this.config.allowedTables.includes(table)) {
          return {
            isValid: false,
            reason: `Access to table '${table}' is not in allowed list`
          };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Extract table names from SQL query
   */
  private extractTableNames(query: string): string[] {
    const tables = new Set<string>();

    // Match FROM table and JOIN table patterns
    const tablePatterns = [
      /from\s+(\w+(?:\.\w+)?)(?:\s+as\s+(\w+))?/gi,
      /join\s+(\w+(?:\.\w+)?)(?:\s+as\s+(\w+))?/gi,
      /insert\s+into\s+(\w+(?:\.\w+)?)/gi,
      /update\s+(\w+(?:\w+)?)(?:\s+set)/gi,
      /delete\s+from\s+(\w+(?:\w+)?)/gi,
      /create\s+table\s+(\w+(?:\w+)?)/gi,
      /drop\s+table\s+(\w+(?:\w+)?)/gi,
      /alter\s+table\s+(\w+(?:\w+)?)/gi,
      /truncate\s+table\s+(\w+(?:\w+)?)/gi,
    ];

    for (const pattern of tablePatterns) {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        tables.add(match[1]); // Primary table name
        if (match[2]) { // Table alias
          tables.add(match[2]);
        }
      }
    }

    return Array.from(tables);
  }

  /**
   * Check if table access is allowed
   */
  canAccessTable(table: string): boolean {
    if (this.config.blockedTables?.includes(table)) {
      return false;
    }

    if (this.config.allowedTables) {
      return this.config.allowedTables.includes(table);
    }

    return true; // No restrictions
  }

  /**
   * Check if write operations are allowed
   */
  canWrite(): boolean {
    return this.config.allowWriteOps;
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: string, details: Record<string, any> = {}): void {
    if (this.config.logSecurityEvents) {
      console.warn(`[SECURITY] ${event}`, details);
    }
  }
}

export { SecurityConfig };