/**
 * EduOntology Neo4j Configuration
 * Type-safe configuration management for Neo4j database
 */

import dotenv from 'dotenv'
import { Config } from 'neo4j-driver'

// Allow local `.env` usage for scripts that import this module directly.
dotenv.config()

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// Neo4j Configuration Interface
export interface Neo4jConfig extends Config {
  url: string
  username: string
  password: string
  database?: string
  connectionPool?: {
    maxConnectionPoolSize: number
    connectionAcquisitionTimeout: number
    maxConnectionLifetime: number
  }
  retry?: {
    maxRetryAttempts: number
    initialRetryDelay: number
    maxRetryDelay: number
    retryJitterFactor: number
  }
}

// Default configuration
const defaultConfig: Neo4jConfig = {
  url: process.env['NEO4J_URL'] || 'bolt://localhost:7687',
  username: process.env['NEO4J_USERNAME'] || 'neo4j',
  password: process.env['NEO4J_PASSWORD'] || '',
  database: process.env['NEO4J_DATABASE'] || 'eduontology',
  connectionPool: {
    maxConnectionPoolSize: isProduction ? 100 : 50,
    connectionAcquisitionTimeout: 30000,
    maxConnectionLifetime: 3600000, // 1 hour
  },
  retry: {
    maxRetryAttempts: isProduction ? 5 : 3,
    initialRetryDelay: 1000,
    maxRetryDelay: 10000,
    retryJitterFactor: 0.1,
  },
}

// Validate configuration
function validateConfig(config: Neo4jConfig): Neo4jConfig {
  if (!config.url) {
    throw new Error('Neo4j URL is required')
  }

  if (!config.username) {
    throw new Error('Neo4j username is required')
  }

  if (!config.password) {
    throw new Error('Neo4j password is required')
  }

  if (config.connectionPool) {
    if (config.connectionPool.maxConnectionPoolSize <= 0) {
      throw new Error('Connection pool size must be greater than 0')
    }

    if (config.connectionPool.maxConnectionPoolSize > 1000) {
      console.warn('Connection pool size exceeds recommended limit (1000)')
    }
  }

  if (config.retry) {
    if (config.retry.maxRetryAttempts <= 0) {
      throw new Error('Max retry attempts must be greater than 0')
    }
  }

  return config
}

// Get environment-specific configuration
function getEnvironmentConfig(): Partial<Neo4jConfig> {
  switch (process.env.NODE_ENV) {
    case 'development':
      return {
        connectionPool: {
          maxConnectionPoolSize: 20,
          connectionAcquisitionTimeout: 30000,
          maxConnectionLifetime: 3600000,
        },
        retry: {
          maxRetryAttempts: 3,
          initialRetryDelay: 500,
          maxRetryDelay: 5000,
          retryJitterFactor: 0.1,
        },
      }

    case 'production':
      return {
        connectionPool: {
          maxConnectionPoolSize: 100,
          connectionAcquisitionTimeout: 20000,
          maxConnectionLifetime: 7200000, // 2 hours
        },
        retry: {
          maxRetryAttempts: 5,
          initialRetryDelay: 1000,
          maxRetryDelay: 15000,
          retryJitterFactor: 0.2,
        },
      }

    case 'test':
      return {
        connectionPool: {
          maxConnectionPoolSize: 10,
          connectionAcquisitionTimeout: 10000,
          maxConnectionLifetime: 600000, // 10 minutes
        },
        retry: {
          maxRetryAttempts: 1,
          initialRetryDelay: 200,
          maxRetryDelay: 1000,
          retryJitterFactor: 0.1,
        },
      }

    default:
      return {}
  }
}

// Resolve configuration
export const neo4jConfig: Neo4jConfig = validateConfig({
  ...defaultConfig,
  ...getEnvironmentConfig(),
})

// Configuration for different environments
export const configs = {
  development: validateConfig({
    ...defaultConfig,
    ...getEnvironmentConfig(),
    url: process.env['NEO4J_URL_DEV'] || 'bolt://localhost:7687',
  }),

  production: validateConfig({
    ...defaultConfig,
    ...getEnvironmentConfig(),
    url: process.env['NEO4J_URL_PROD'] || 'bolt://prod-cluster:7687',
  }),

  test: validateConfig({
    ...defaultConfig,
    ...getEnvironmentConfig(),
    url: process.env['NEO4J_URL_TEST'] || 'bolt://test-localhost:7687',
    database: 'eduontology-test',
  }),
}

// Export configuration selector
export function getConfig(env?: string): Neo4jConfig {
  const environment = env || process.env.NODE_ENV || 'development'
  return configs[environment as keyof typeof configs] || configs.development
}

// Export for easy access
export default neo4jConfig
