/**
 * Database Configuration Module
 * Central configuration for PostgreSQL connection settings
 */

import { z } from 'zod';

// Environment variable schema for validation
const EnvConfigSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  PGHOST: z.string().optional(),
  PGPORT: z.coerce.number().int().min(1).max(65535).optional(),
  PGDATABASE: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
  DANGEROUSLY_ALLOW_WRITE_OPS: z.enum(['true', 'false', '1', '0']).optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  STRUCTURED_LOGGING: z.enum(['true', 'false']).optional(),
});

export interface DatabaseConfig {
  databaseUrl?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  allowWriteOps?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  structuredLogging?: boolean;
  pool?: {
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
}

// Default configuration values
const DEFAULT_CONFIG: DatabaseConfig = {
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'password',
  allowWriteOps: false,
  logLevel: 'info',
  structuredLogging: false,
  pool: {
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  },
};

/**
 * Load and validate database configuration from environment variables
 */
export function loadConfig(): DatabaseConfig {
  try {
    // Validate environment variables
    const envConfig = EnvConfigSchema.parse(process.env);

    // Merge with defaults
    const config: DatabaseConfig = {
      ...DEFAULT_CONFIG,
      databaseUrl: envConfig.DATABASE_URL,
      host: envConfig.PGHOST ?? DEFAULT_CONFIG.host,
      port: envConfig.PGPORT ?? DEFAULT_CONFIG.port,
      database: envConfig.PGDATABASE ?? DEFAULT_CONFIG.database,
      user: envConfig.PGUSER ?? DEFAULT_CONFIG.user,
      password: envConfig.PGPASSWORD ?? DEFAULT_CONFIG.password,
      allowWriteOps: envConfig.DANGEROUSLY_ALLOW_WRITE_OPS
        ? ['true', '1'].includes(envConfig.DANGEROUSLY_ALLOW_WRITE_OOPS)
        : DEFAULT_CONFIG.allowWriteOps,
      logLevel: envConfig.LOG_LEVEL ?? DEFAULT_CONFIG.logLevel,
      structuredLogging: envConfig.STRUCTURED_LOGGING === 'true',
    };

    // Validate required configuration
    validateConfig(config);

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Configuration validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path?.join('.') || 'unknown'}: ${err.message}`);
      });
    } else {
      console.error('❌ Failed to load configuration:', error.message);
    }
    process.exit(1);
  }
}

/**
 * Validate configuration values
 */
function validateConfig(config: DatabaseConfig): void {
  // Check if we have either DATABASE_URL or individual parameters
  if (!config.databaseUrl && (!config.host || !config.database || !config.user)) {
    throw new Error(
      'Database configuration incomplete. Either DATABASE_URL or host/database/user must be specified.'
    );
  }

  // Validate port range
  if (config.port && (config.port < 1 || config.port > 65535)) {
    throw new Error('Database port must be between 1 and 65535');
  }

  // Validate connection pool settings
  if (config.pool) {
    if (config.pool.max && (config.pool.max < 1 || config.pool.max > 20)) {
      throw new Error('Maximum pool connections must be between 1 and 20');
    }
    if (config.pool.idleTimeoutMillis && config.pool.idleTimeoutMillis < 1000) {
      throw new Error('Idle timeout must be at least 1000ms');
    }
    if (config.pool.connectionTimeoutMillis && config.pool.connectionTimeoutMillis < 1000) {
      throw new Error('Connection timeout must be at least 1000ms');
    }
  }
}

/**
 * Create connection options for postgres.js
 */
export function createConnectionOptions(config: DatabaseConfig): postgres.Options<{}> {
  if (config.databaseUrl) {
    return {
      max: config.pool?.max,
      idle_timeout: config.pool?.idleTimeoutMillis ? Math.floor(config.pool.idleTimeoutMillis / 1000) : undefined,
      connect_timeout: config.pool?.connectionTimeoutMillis ? Math.floor(config.pool.connectionTimeoutMillis / 1000) : undefined,
      types: {
        // Custom type conversions if needed
      },
      transform: postgres.camel,
    };
  }

  return {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: config.pool?.max,
    idle_timeout: config.pool?.idleTimeoutMillis ? Math.floor(config.pool.idleTimeoutMillis / 1000) : undefined,
    connect_timeout: config.pool?.connectionTimeoutMillis ? Math.floor(config.pool.connectionTimeoutMillis / 1000) : undefined,
    types: {
      // Custom type conversions if needed
    },
    transform: postgres.camel,
  };
}

/**
 * Get database URL from configuration
 */
export function getDatabaseUrl(config: DatabaseConfig): string {
  if (config.databaseUrl) {
    return config.databaseUrl;
  }

  // Build URL from individual parameters
  const { host, port, database, user, password } = config;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${encodeURIComponent(host || 'localhost')}:${port}/${encodeURIComponent(database)}`;
}

export { DatabaseConfig };
export { EnvConfigSchema };