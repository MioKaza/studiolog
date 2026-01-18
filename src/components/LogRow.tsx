'use client'

import React from 'react'
import { LogEntry } from '../types'

interface LogRowProps {
    log: LogEntry
    isCurrentMatch?: boolean
    searchQuery?: string
}

// New icon (flask/potion style)
const LogIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" className="shrink-0 mr-2 opacity-70">
        <path fill="currentColor" d="M15 4h1v2h-1v3h-1v3h-1v2h-1v3h-1v3h-1v1H9v-1H8v-2h1v-3h1v-3h1v-2h1V7h1V4h1V3h1zm8 7v2h-1v1h-1v1h-1v1h-1v1h-2v-2h1v-1h1v-1h1v-2h-1v-1h-1V9h-1V7h2v1h1v1h1v1h1v1zM7 7v2H6v1H5v1H4v2h1v1h1v1h1v2H5v-1H4v-1H3v-1H2v-1H1v-2h1v-1h1V9h1V8h1V7z" />
    </svg>
)

export function LogRow({ log, isCurrentMatch }: LogRowProps) {
    // Level colors using the new palette
    const levelColors: Record<string, string> = {
        error: 'var(--sl-red)',
        warn: 'var(--sl-orange)',
        info: 'var(--sl-cyan)',
        debug: 'var(--sl-purple)',
        log: 'var(--sl-yellow)'
    }

    const color = levelColors[log.level] || 'var(--sl-fg)'

    // Check if it's a command/box output
    const isBox = log.message.includes('╭') || log.message.includes('│') || log.message.includes('╰') ||
        log.message.includes('╔') || log.message.includes('║') || log.message.includes('╚') ||
        log.message.includes('─') || log.message.includes('═')

    if (isBox) {
        return (
            <div
                className="whitespace-pre leading-tight py-1 sl-bold"
                style={{
                    color: 'var(--sl-cyan)',
                    backgroundColor: isCurrentMatch ? 'rgba(139, 233, 253, 0.1)' : 'transparent'
                }}
            >
                {log.message}
            </div>
        )
    }

    // Check if it's a progress bar line
    const isProgress = (log.message.includes('░') || log.message.includes('█')) && log.message.includes('%')
    if (isProgress) {
        const parts = log.message.split(' ')
        const bar = parts[0]
        const percent = parts[1]
        const msg = parts.slice(2).join(' ')
        return (
            <div
                className="leading-relaxed py-[2px] flex items-center font-mono"
                style={{
                    color: 'var(--sl-cyan)',
                    backgroundColor: isCurrentMatch ? 'rgba(139, 233, 253, 0.1)' : 'transparent',
                }}
            >
                <span className="sl-bold mr-2 shrink-0" style={{ color: 'var(--sl-pink)' }}>LOADING:</span>
                <span className="shrink-0" style={{ color: 'var(--sl-fg)' }}>[{bar}]</span>
                <span className="ml-2 shrink-0" style={{ color: 'var(--sl-yellow)' }}>{percent}</span>
                <span className="ml-2 opacity-80 italic" style={{ color: 'var(--sl-fg-dim)' }}>{msg}</span>
            </div>
        )
    }

    // Regular log line - NO TIMESTAMP, with icon
    return (
        <div
            className="leading-relaxed py-[2px] flex items-center font-mono"
            style={{
                backgroundColor: isCurrentMatch ? 'rgba(139, 233, 253, 0.1)' : 'transparent',
            }}
        >
            <LogIcon />
            <span className="sl-bold mr-2 shrink-0" style={{ color, fontWeight: 700 }}>{log.level.toUpperCase()}</span>
            <span style={{ color: 'var(--sl-fg)' }}>{log.message}</span>
        </div>
    )
}
