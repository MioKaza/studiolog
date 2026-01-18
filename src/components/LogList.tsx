'use client'

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { LogEntry, SearchState, TailState } from '../types'
import { LogRow } from './LogRow'

interface LogListProps {
    logs: LogEntry[]
    search: SearchState
    tail: TailState
    onToggleExpand: (id: string) => void
    onTogglePin: (id: string) => void
}

export interface LogListHandle {
    scrollToIndex: (index: number) => void
}

export const LogList = forwardRef<LogListHandle, LogListProps>(function LogList(
    { logs, search, tail },
    ref
) {
    const parentRef = useRef<HTMLDivElement>(null)
    const logsEndRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
        scrollToIndex: (index: number) => {
            const elements = parentRef.current?.querySelectorAll('.log-row')
            if (elements && elements[index]) {
                elements[index].scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }
    }))

    useEffect(() => {
        if (tail.isEnabled && !tail.isPaused && logs.length > 0) {
            logsEndRef.current?.scrollIntoView({ behavior: 'auto' })
        }
    }, [logs.length, tail])

    return (
        <div
            ref={parentRef}
            className="flex-1 overflow-y-auto px-4 py-2"
            style={{ backgroundColor: 'var(--sl-bg)' }}
        >
            <div className="flex flex-col">
                {logs.map((log) => {
                    const isMatch = search.isActive && search.matches.includes(log.id)
                    const isCurrentMatch = isMatch && search.matches[search.currentIndex] === log.id

                    return (
                        <div key={log.id} className="log-row">
                            <LogRow
                                log={log}
                                isCurrentMatch={isCurrentMatch}
                                searchQuery={search.query}
                            />
                        </div>
                    )
                })}
                <div ref={logsEndRef} />
            </div>

            {logs.length === 0 && (
                <div className="text-center py-20 italic" style={{ color: 'var(--sl-fg-dim)' }}>
                    [ system idling... ]
                </div>
            )}
        </div>
    )
})
