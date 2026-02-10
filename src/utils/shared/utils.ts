// MVP: avoid loading dotenv/validating env in shared (client-importable) code.
export const env = {
  NODE_ENV: process.env['NODE_ENV'] || 'development',
} as const;

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

/**
 * Throttle function to limit how often a function can be called
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format duration in minutes to HH:MM:SS
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const seconds = Math.floor((minutes * 60) % 60);

  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sleep function for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let retryCount = 0;
  let delay = initialDelay;

  while (retryCount < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      retryCount++;
      if (retryCount === maxRetries) throw error;

      await sleep(delay);
      delay *= 2; // Exponential backoff
    }
  }

  throw new Error('Max retries exceeded');
}

/**
 * Check if an object is empty
 */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Get nested object value by path
 */
export function getNestedValue(obj: object, path: string, defaultValue?: any): any {
  return path.split('.').reduce((acc, key) => {
    return acc && acc[key] !== undefined ? acc[key] : defaultValue;
  }, obj);
}

/**
 * Set nested object value by path
 */
export function setNestedValue(obj: object, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;

  const target = keys.reduce((acc, key) => {
    if (!acc[key]) acc[key] = {};
    return acc[key];
  }, obj);

  target[lastKey] = value;
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Get API base URL based on environment
 */
export function getAPIBaseURL(): string {
  return isProduction()
    ? 'https://api.eduontology.com'
    : 'http://localhost:3000';
}

/**
 * Check if current environment is production
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Check if current environment is development
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

/**
* Logger with different levels
*/
export const logger = {
  info: (message: string, data?: any) => {
    if (isDevelopment()) {
      console.log(`[INFO] ${message}`, data || '');
    }
  },

  warn: (message: string, data?: any) => {
    if (isDevelopment()) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  },

  debug: (message: string, data?: any) => {
    if (isDevelopment()) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
};

/**
* Async wrapper for error handling
*/
export async function asyncWrapper<T>(fn: () => Promise<T>): Promise<{ data: T | null; error: Error | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
* Performance monitoring
*/
export const performance = {
  start: (label: string) => {
    console.time(label);
  },

  end: (label: string) => {
    console.timeEnd(label);
  }
};

// Export common error types
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class APIError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'APIError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// `env` is exported above.
