interface LogEntry {
  id: string
  timestamp: Date
  level: 'log' | 'warn' | 'error'
  args: any[]
  stack?: string
}

type LogCallback = (entry: LogEntry) => void

class ConsoleProxy {
  private originalConsole: {
    log: typeof console.log
    warn: typeof console.warn
    error: typeof console.error
  }
  private callbacks: Set<LogCallback> = new Set()
  private isInitialized = false

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    }
  }

  init(callback: LogCallback): () => void {
    this.callbacks.add(callback)

    if (!this.isInitialized) {
      this.setupInterception()
      this.isInitialized = true
    }

    // Return cleanup function
    return () => {
      this.callbacks.delete(callback)
      if (this.callbacks.size === 0) {
        this.cleanup()
      }
    }
  }

  private setupInterception() {
    // Override console.log
    console.log = (...args: any[]) => {
      this.originalConsole.log(...args)
      this.captureLog('log', args)
    }

    // Override console.warn
    console.warn = (...args: any[]) => {
      this.originalConsole.warn(...args)
      this.captureLog('warn', args)
    }

    // Override console.error
    console.error = (...args: any[]) => {
      this.originalConsole.error(...args)
      this.captureLog('error', args, this.getStackTrace())
    }
  }

  private captureLog(level: 'log' | 'warn' | 'error', args: any[], stack?: string) {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      args: this.safeCloneArgs(args),
      stack
    }

    // Defer callback execution to avoid setState during render
    setTimeout(() => {
      this.callbacks.forEach(callback => {
        try {
          callback(entry)
        } catch (error) {
          // Prevent infinite loops if callback throws
          this.originalConsole.error('Peek callback error:', error)
        }
      })
    }, 0)
  }

  private safeCloneArgs(args: any[]): any[] {
    return args.map(arg => {
      if (arg === null || arg === undefined) {
        return arg
      }

      if (typeof arg === 'string') {
        return this.cleanString(arg)
      }

      if (typeof arg === 'number' || typeof arg === 'boolean') {
        return arg
      }

      // For objects and arrays, create a safe representation with limits
      try {
        return this.createSafeObject(arg)
      } catch {
        return `[${typeof arg}] ${String(arg)}`
      }
    })
  }

  // Strip ANSI escape codes and CSS styling from strings
  private cleanString(str: string): string {
    // Remove ANSI escape codes
    let clean = str.replace(/\x1b\[[0-9;]*m/g, '')
    // Remove %c CSS styling placeholders and their styles
    clean = clean.replace(/%c/g, '')
    // Remove common CSS style strings that leak through
    clean = clean.replace(/background:\s*[^;]+;?/gi, '')
    clean = clean.replace(/color:\s*[^;]+;?/gi, '')
    clean = clean.replace(/border-radius:\s*[^;]+;?/gi, '')
    clean = clean.replace(/light-dark\([^)]+\)/gi, '')
    clean = clean.replace(/rgba?\([^)]+\)/gi, '')
    // Clean up extra whitespace
    clean = clean.replace(/\s+/g, ' ').trim()
    // Remove the unicode box drawing characters used in ANSI art
    clean = clean.replace(/[▐▌]/g, '')
    return clean
  }

  private createSafeObject(obj: any, depth = 0, seen = new WeakSet()): any {
    if (depth > 3) return '[Max Depth Reached]'
    if (seen.has(obj)) return '[Circular Reference]'

    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    seen.add(obj)

    if (Array.isArray(obj)) {
      return obj.slice(0, 10).map(item => this.createSafeObject(item, depth + 1, seen))
    }

    const result: any = {}
    const keys = Object.keys(obj).slice(0, 10) // Limit keys to prevent huge objects

    for (const key of keys) {
      try {
        result[key] = this.createSafeObject(obj[key], depth + 1, seen)
      } catch {
        result[key] = '[Error accessing property]'
      }
    }

    if (Object.keys(obj).length > 10) {
      result['...'] = `[${Object.keys(obj).length - 10} more properties]`
    }

    return result
  }

  private getStackTrace(): string {
    try {
      throw new Error()
    } catch (error) {
      return (error as Error).stack || ''
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private cleanup() {
    if (this.isInitialized) {
      // Restore original console methods
      console.log = this.originalConsole.log
      console.warn = this.originalConsole.warn
      console.error = this.originalConsole.error
      this.isInitialized = false
    }
  }

  // Public method to manually log to Peek without console output
  peekLog(level: 'log' | 'warn' | 'error', ...args: any[]) {
    this.captureLog(level, args, level === 'error' ? this.getStackTrace() : undefined)
  }
}

// Export singleton instance
export const consoleProxy = new ConsoleProxy()