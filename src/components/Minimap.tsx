'use client'

import React, { useMemo } from 'react'
import { LogEntry } from '../types'

interface MinimapProps {
    logs: LogEntry[]
    onJumpTo: (id: string) => void
}

export function Minimap({ logs, onJumpTo }: MinimapProps) {
    // Calculate tick positions for errors and warnings
    const ticks = useMemo(() => {
        if (logs.length === 0) return []

        return logs
            .map((log, index) => ({
                id: log.id,
                position: (index / logs.length) * 100,
                level: log.level
            }))
            .filter(tick => tick.level === 'error' || tick.level === 'warn')
    }, [logs])

    // Group close ticks to avoid visual clutter
    const groupedTicks = useMemo(() => {
        const grouped: typeof ticks = []
        const threshold = 1 // 1% distance

        for (const tick of ticks) {
            const lastTick = grouped[grouped.length - 1]
            if (lastTick && Math.abs(tick.position - lastTick.position) < threshold) {
                // Prefer showing errors over warnings
                if (tick.level === 'error' && lastTick.level !== 'error') {
                    grouped[grouped.length - 1] = tick
                }
            } else {
                grouped.push(tick)
            }
        }

        return grouped
    }, [ticks])

    if (logs.length === 0) return null

    return (
        <div className="w-3 shrink-0 bg-[var(--sl-minimap-bg)] border-l border-[var(--sl-border-subtle)] relative">
            {/* Track background */}
            <div className="absolute inset-0 bg-[var(--sl-minimap-track)]" />

            {/* Ticks */}
            {groupedTicks.map((tick) => (
                <button
                    key={tick.id}
                    onClick={() => onJumpTo(tick.id)}
                    className="absolute left-0 right-0 h-1 transition-colors hover:opacity-80"
                    style={{
                        top: `${tick.position}%`,
                        backgroundColor: tick.level === 'error'
                            ? 'var(--sl-error-border)'
                            : 'var(--sl-warn-border)',
                    }}
                    title={`Jump to ${tick.level}`}
                />
            ))}

            {/* Current viewport indicator (optional - could be added with scroll position) */}
        </div>
    )
}
