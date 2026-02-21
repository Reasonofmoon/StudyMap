/**
 * EduOntology Neo4j Driver
 * Type-safe Neo4j driver implementation with error handling and performance optimizations
 */

import neo4jDriverLib, {
  Driver,
  Session,
  SessionConfig,
  Result,
  ResultSummary,
  Record as Neo4jRecord,
  ManagedTransaction,
} from 'neo4j-driver'
import { neo4jConfig, Neo4jConfig } from './config'

// Error types
export interface Neo4jError extends Error {
  code: string
  message: string
}

// Custom error classes
export class Neo4jConnectionError extends Error implements Neo4jError {
  code = 'NEO4J_CONNECTION_ERROR'
  constructor(message: string) {
    super(message)
    this.name = 'Neo4jConnectionError'
  }
}

export class Neo4jQueryError extends Error implements Neo4jError {
  code = 'NEO4J_QUERY_ERROR'
  constructor(message: string) {
    super(message)
    this.name = 'Neo4jQueryError'
  }
}

export class Neo4jTimeoutError extends Error implements Neo4jError {
  code = 'NEO4J_TIMEOUT_ERROR'
  constructor(message: string) {
    super(message)
    this.name = 'Neo4jTimeoutError'
  }
}

// Common parameter type for Neo4j queries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Neo4jParams = { [key: string]: any }

// Internal type for Neo4j driver operations - absorbs library type mismatches
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Neo4jDriverResult = any

// Result wrapper with metadata
export interface Neo4jResult<T = unknown> {
  records: Neo4jDriverResult[]
  summary: Neo4jDriverResult
  keys: string[]
  count: number
  metadata: {
    query: string
    parameters: Neo4jParams
    executionTime: number
    rowCount: number
    consumedAfter: number
    availableAfter: number
  }
}

// Session types
export interface SessionType {
  READ: 'READ'
  WRITE: 'WRITE'
}

// Query execution options
export interface QueryOptions {
  timeout?: number
  database?: string
  accessMode?: keyof SessionType
  transactionConfig?: SessionConfig
}

// Performance metrics
export interface PerformanceMetrics {
  executionTime: number
  rowCount: number
  count: number
  avgExecutionTime: number
  queryCount: number
  errorCount: number
}

// Singleton driver instance
class Neo4jDriverSingleton {
  private static instance: Driver | null = null
  private static metrics: PerformanceMetrics = {
    executionTime: 0,
    rowCount: 0,
    count: 0,
    avgExecutionTime: 0,
    queryCount: 0,
    errorCount: 0,
  }

  // Get or create driver instance
  static getInstance(config: Neo4jConfig): Driver {
    if (!this.instance) {
      try {
        const driverConfig: any = {
          // neo4j-driver expects these flattened top-level keys.
          maxConnectionPoolSize: config.connectionPool?.maxConnectionPoolSize,
          connectionAcquisitionTimeout: config.connectionPool?.connectionAcquisitionTimeout,
          maxConnectionLifetime: config.connectionPool?.maxConnectionLifetime,
        }

        this.instance = neo4jDriverLib.driver(
          config.url,
          neo4jDriverLib.auth.basic(config.username, config.password),
          driverConfig
        )

        // Fire-and-forget connectivity check. Avoid throwing from an async callback
        // during module initialization, which is hard to handle correctly.
        void this.instance.verifyConnectivity().catch((error: any) => {
          console.error('Neo4j connection failed:', error)
        })
      } catch (error) {
        if (error instanceof Error) {
          throw new Neo4jConnectionError(`Failed to initialize Neo4j driver: ${error.message}`)
        }
        throw new Neo4jConnectionError('Unknown error initializing Neo4j driver')
      }
    }
    return this.instance
  }

  // Get metrics
  static getMetrics(): PerformanceMetrics {
    // Calculate average
    this.metrics.avgExecutionTime = this.metrics.queryCount > 0
      ? this.metrics.executionTime / this.metrics.queryCount
      : 0

    return { ...this.metrics }
  }

  // Reset metrics
  static resetMetrics(): void {
    this.metrics = {
      executionTime: 0,
      rowCount: 0,
      count: 0,
      avgExecutionTime: 0,
      queryCount: 0,
      errorCount: 0,
    }
  }

  // Reset driver instance
  static resetInstance(): void {
    this.instance = null
  }
}

// Main Neo4j Driver Class
export class EduOntologyNeo4jDriver {
  private driver: Driver
  private config: Neo4jConfig

  constructor(config: Neo4jConfig = neo4jConfig) {
    this.config = config
    this.driver = Neo4jDriverSingleton.getInstance(config)
  }

  // Execute read query
  async read<T = unknown>(
    query: string,
    parameters: Neo4jParams = {} as Neo4jParams,
    options: QueryOptions = {}
  ): Promise<Neo4jResult<T>> {
    return this.execute<T>(query, parameters, { ...options, accessMode: 'READ' })
  }

  // Execute write query
  async write<T = unknown>(
    query: string,
    parameters: Neo4jParams = {} as Neo4jParams,
    options: QueryOptions = {}
  ): Promise<Neo4jResult<T>> {
    return this.execute<T>(query, parameters, { ...options, accessMode: 'WRITE' })
  }

  // Execute query with error handling and metrics
  private async execute<T = unknown>(
    query: string,
    parameters: Neo4jParams = {} as Neo4jParams,
    options: QueryOptions = {}
  ): Promise<Neo4jResult<T>> {
    const startTime = performance.now()
    let session: Session | null = null

    try {
      const accessMode = options.accessMode === 'WRITE'
        ? neo4jDriverLib.session.WRITE
        : neo4jDriverLib.session.READ

      const sessionConfig: SessionConfig = {
        database: (options.database || this.config.database || 'neo4j') as string,
        defaultAccessMode: accessMode,
      }

      session = this.driver.session(sessionConfig)

      const result: Neo4jDriverResult = await session.run(query, parameters as any)

      const endTime = performance.now()
      const executionTime = endTime - startTime

      const summary: Neo4jDriverResult = result.summary ?? null

      const neo4jResult: Neo4jResult<T> = {
        records: result.records as Neo4jDriverResult[],
        summary,
        keys: result.keys as string[],
        count: result.records.length as number,
        metadata: {
          query,
          parameters,
          executionTime,
          rowCount: result.records.length,
          consumedAfter: 0,
          availableAfter: 0,
        },
      }

      this.updateMetrics(executionTime, result.records.length)

      return neo4jResult

    } catch (error) {
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Update error metrics
      this.updateMetrics(executionTime, 0, true)

      // Handle specific error types
      const err = error as { [key: string]: unknown }
      if (err && typeof err === 'object' && 'code' in err) {
        switch (err['code']) {
          case 'ServiceUnavailable':
            throw new Neo4jConnectionError(`Neo4j service unavailable: ${err['message']}`)
          case 'QueryTimedOut':
            throw new Neo4jTimeoutError(`Query timed out: ${err['message']}`)
          default:
            throw new Neo4jQueryError(`Neo4j query error: ${err['message']}`)
        }
      }

      throw new Neo4jQueryError(`Unexpected error executing query: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      if (session) {
        await session.close()
      }
    }
  }

  // Execute query in transaction
  async transaction<T = any>(
    operations: (tx: ManagedTransaction) => Promise<T>,
    options: QueryOptions = {}
  ): Promise<T> {
    const startTime = performance.now()
    let session: Session | null = null

    try {
      const sessionConfig: any = {
        database: options.database || this.config.database || 'neo4j',
        defaultAccessMode: neo4jDriverLib.session.WRITE,
        ...options.transactionConfig,
      }

      session = this.driver.session(sessionConfig)
      const result: T = await session.executeWrite(operations)

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Update metrics
      this.updateMetrics(executionTime, 1)

      return result

    } catch (error) {
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Update error metrics
      this.updateMetrics(executionTime, 0, true)

      throw new Neo4jQueryError(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      if (session) {
        await session.close()
      }
    }
  }

  // Close driver connection
  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close()
      Neo4jDriverSingleton.resetInstance()
    }
  }

  // Update metrics
  private updateMetrics(executionTime: number, rowCount: number, isError: boolean = false): void {
    const current = Neo4jDriverSingleton.getMetrics();
    (Neo4jDriverSingleton as any).metrics = {
      executionTime: current.executionTime + executionTime,
      rowCount: current.rowCount + rowCount,
      count: current.count + rowCount,
      avgExecutionTime: current.avgExecutionTime,
      queryCount: current.queryCount + 1,
      errorCount: isError ? current.errorCount + 1 : current.errorCount,
    }
  }

  // Get driver health
  async healthCheck(): Promise<{ healthy: boolean; latency: number; version?: string }> {
    const startTime = performance.now()

    try {
      await this.driver.verifyConnectivity()
      const latency = performance.now() - startTime

      return {
        healthy: true,
        latency,
      }
    } catch (error) {
      const latency = performance.now() - startTime

      return {
        healthy: false,
        latency,
      }
    }
  }

  // Get database info
  async getDatabaseInfo(): Promise<{ name?: string; version?: string; edition?: string }> {
    const result = await this.write(
      'CALL dbms.info()',
      {} as Neo4jParams
    )

    const record = result.records[0]
    return {
      name: record.get('name')?.toString(),
      version: record.get('version')?.toString(),
      edition: record.get('edition')?.toString(),
    }
  }

  // Create custom session with specific configuration
  createSession(options: Partial<SessionConfig> = {}): Session {
    return this.driver.session({
      database: this.config.database || 'neo4j',
      defaultAccessMode: 'READ',
      ...options,
    })
  }
}

// Export singleton instance for easy use
export const neo4jDriver = new EduOntologyNeo4jDriver(neo4jConfig)

// Export convenience methods
export const neo4j = {
  read: neo4jDriver.read.bind(neo4jDriver),
  write: neo4jDriver.write.bind(neo4jDriver),
  transaction: neo4jDriver.transaction.bind(neo4jDriver),
  close: neo4jDriver.close.bind(neo4jDriver),
  healthCheck: neo4jDriver.healthCheck.bind(neo4jDriver),
  getDatabaseInfo: neo4jDriver.getDatabaseInfo.bind(neo4jDriver),
  getMetrics: Neo4jDriverSingleton.getMetrics,
  resetMetrics: Neo4jDriverSingleton.resetMetrics,
}
