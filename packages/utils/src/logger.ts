type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

const LOG_COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
} as const;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel = 'info';
  private context?: string;

  constructor(context?: string) {
    this.context = context;
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatMessage(log: LogMessage): string {
    const color = LOG_COLORS[log.level];
    const reset = LOG_COLORS.reset;
    const prefix = this.context ? `[${this.context}]` : '';
    const dataStr = log.data ? ` ${JSON.stringify(log.data)}` : '';

    return `${color}[${log.timestamp}] ${log.level.toUpperCase()}${reset} ${prefix} ${log.message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const logMessage: LogMessage = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    const formatted = this.formatMessage(logMessage);

    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      // eslint-disable-next-line no-console
      console.log(formatted);
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  child(context: string): Logger {
    return new Logger(`${this.context ? this.context + ':' : ''}${context}`);
  }
}

/**
 * Create a logger instance
 */
export function createLogger(context?: string): Logger {
  return new Logger(context);
}

/**
 * Default logger instance
 */
export const logger = createLogger();
