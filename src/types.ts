// StudioLog Types
export interface LogEntry {
    id: string
    timestamp: Date
    level: 'log' | 'info' | 'warn' | 'error' | 'debug'
    message: string
    source?: string
    args: any[]
    stack?: string
    expanded?: boolean
    pinned?: boolean
}

export interface LogFilter {
    log: boolean
    info: boolean
    warn: boolean
    error: boolean
    debug: boolean
}

export interface SearchState {
    query: string
    matches: string[]  // IDs of matching logs
    currentIndex: number
    isActive: boolean
}

export interface TailState {
    isEnabled: boolean
    isPaused: boolean
}

export interface ConnectionState {
    status: 'connected' | 'disconnected' | 'connecting'
    latency?: number
}

export interface SessionInfo {
    appName: string
    version: string
    project?: string
    startTime: Date
}

export type DockMode = 'bottom' | 'right' | 'float'

// Sample log data for testing
export const SAMPLE_LOGS: Omit<LogEntry, 'id' | 'timestamp'>[] = [
    { level: 'info', message: 'Application started', source: 'main', args: ['Application started'] },
    { level: 'log', message: 'Loading configuration from disk...', source: 'config', args: ['Loading configuration from disk...'] },
    { level: 'log', message: 'Database connection established', source: 'db', args: ['Database connection established'] },
    { level: 'info', message: 'Loaded 42 projects from database', source: 'db', args: ['Loaded 42 projects from database'] },
    { level: 'warn', message: 'Deprecated API call detected: useOldMethod()', source: 'api', args: ['Deprecated API call detected: useOldMethod()'] },
    { level: 'log', message: 'Rendering dashboard component', source: 'ui', args: ['Rendering dashboard component'] },
    { level: 'error', message: 'Failed to fetch remote config', source: 'network', args: ['Failed to fetch remote config'], stack: 'Error: Network request failed\n    at fetch (/app/network.ts:42:5)\n    at getConfig (/app/config.ts:15:3)' },
    { level: 'log', message: 'User session initialized', source: 'auth', args: ['User session initialized'] },
    { level: 'debug', message: 'Cache hit for key: user_preferences', source: 'cache', args: ['Cache hit for key: user_preferences'] },
    { level: 'info', message: 'Hot reload triggered', source: 'dev', args: ['Hot reload triggered'] },
]
