import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schemas
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Neo4j
  NEO4J_URL: z.string().min(1, 'NEO4J_URL is required'),
  NEO4J_USERNAME: z.string().min(1, 'NEO4J_USERNAME is required'),
  NEO4J_PASSWORD: z.string().min(1, 'NEO4J_PASSWORD is required'),

  // AI APIs
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),

  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Security
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  ENCRYPTION_KEY: z.string().min(1, 'ENCRYPTION_KEY is required'),

  // Optional services
  REDIS_URL: z.string().optional(),
  RABBITMQ_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional()
});

/**
 * Validate environment variables and return validated config
 */
export function validateEnv(): z.infer<typeof envSchema> {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\nPlease check your .env file or set environment variables.');
    }
    process.exit(1);
  }
}

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '')  // Remove HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '')  // Remove control characters
    .replace(/['"\\]/g, '\\$&');  // Escape quotes and backslashes
}

/**
 * Validate and clean email addresses
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a secure random string
 */
export function generateSecureString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint32Array(length);

  // Generate cryptographically secure random values
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}

/**
 * Hash sensitive data for logging
 */
export function hashSensitiveData(data: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
}

/**
 * Check if an environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if an environment is development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
};

/**
 * CORS configuration
 */
export const corsConfig = {
  origin: isProduction()
    ? ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Export environment type for TypeScript
export type Environment = z.infer<typeof envSchema>;