'use client'

import React, { useRef, useEffect } from 'react'
import { LogFilter, SearchState, TailState } from '../types'
import { getIcon } from '../icons'

interface ToolbarProps {
    filter: LogFilter
    search: SearchState
    tail: TailState
    counts: Record<string, number>
    onFilterChange: (filter: LogFilter) => void
    onSearchChange: (query: string) => void
    onNextMatch: () => void
    onPrevMatch: () => void
    onToggleTail: () => void
    onClear: () => void
    onExport: () => void
}

export function Toolbar({
    filter,
    search,
    tail,
    counts,
    onFilterChange,
    onSearchChange,
    onNextMatch,
    onPrevMatch,
    onToggleTail,
    onClear,
    onExport
}: ToolbarProps) {
    const searchInputRef = useRef<HTMLInputElement>(null)

    const SearchIcon = getIcon('Search')
    const ClearIcon = getIcon('Clear')
    const DownloadIcon = getIcon('Download')
    const ChevronIcon = getIcon('Chevron')

    // Filter chip component
    const FilterChip = ({
        level,
        label,
        count,
        color
    }: {
        level: keyof LogFilter
        label: string
        count: number
        color: string
    }) => {
        const isActive = filter[level]
        return (
            <button
                onClick={() => onFilterChange({ ...filter, [level]: !isActive })}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${isActive
                    ? `bg-[${color}]/15 text-[${color}] border border-[${color}]/30`
                    : 'text-[var(--sl-fg-muted)] hover:bg-[var(--sl-bg-hover)] border border-transparent'
                    }`}
                style={isActive ? {
                    backgroundColor: `${color}15`,
                    color: color,
                    borderColor: `${color}30`
                } : {}}
            >
                <span>{label}</span>
                <span className="text-[10px] opacity-70">{count}</span>
            </button>
        )
    }

    return (
        <div className="flex items-center gap-3 px-3 py-2 bg-[var(--sl-bg-surface)] border-b border-[var(--sl-border-subtle)]">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--sl-fg-muted)]">
                    <SearchIcon size={14} />
                </div>
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Filter logs... (⌘F)"
                    value={search.query}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-[var(--sl-bg-base)] border border-[var(--sl-border-default)] focus:border-[var(--sl-focus-ring)] rounded pl-8 pr-3 py-1 text-[12px] text-[var(--sl-fg-primary)] placeholder-[var(--sl-fg-muted)] focus:outline-none transition-colors"
                />
                {search.isActive && search.matches.length > 0 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <span className="text-[10px] text-[var(--sl-fg-muted)] font-mono">
                            {search.currentIndex + 1}/{search.matches.length}
                        </span>
                        <button
                            onClick={onPrevMatch}
                            className="p-0.5 hover:bg-[var(--sl-bg-hover)] rounded text-[var(--sl-fg-muted)]"
                        >
                            <span style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                                {ChevronIcon && <ChevronIcon size={10} />}
                            </span>
                        </button>
                        <button
                            onClick={onNextMatch}
                            className="p-0.5 hover:bg-[var(--sl-bg-hover)] rounded text-[var(--sl-fg-muted)]"
                        >
                            <span style={{ transform: 'rotate(90deg)', display: 'block' }}>
                                {ChevronIcon && <ChevronIcon size={10} />}
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1">
                <FilterChip level="log" label="Log" count={counts.log || 0} color="#569cd6" />
                <FilterChip level="info" label="Info" count={counts.info || 0} color="#4ec9b0" />
                <FilterChip level="warn" label="Warn" count={counts.warn || 0} color="#dcdcaa" />
                <FilterChip level="error" label="Error" count={counts.error || 0} color="#f14c4c" />
            </div>

            {/* Separator */}
            <div className="w-px h-4 bg-[var(--sl-border-subtle)]" />

            {/* Auto-Scroll Toggle */}
            <button
                onClick={onToggleTail}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${!tail.isPaused
                        ? 'bg-[var(--sl-accent-green)]/15 text-[var(--sl-accent-green)] border border-[var(--sl-accent-green)]/30'
                        : 'text-[var(--sl-fg-muted)] hover:bg-[var(--sl-bg-hover)] border border-transparent'
                    }`}
                title={tail.isPaused ? 'Enable Auto-Scroll' : 'Disable Auto-Scroll'}
            >
                <span className="text-[10px]">{!tail.isPaused ? 'Scroll Locked' : 'Scroll Unlocked'}</span>
                {/* Simple visual indicator */}
                <div className={`w-1.5 h-1.5 rounded-full ${!tail.isPaused ? 'bg-current animate-pulse' : 'bg-[var(--sl-fg-faint)]'}`} />
            </button>

            {/* Separator */}
            <div className="w-px h-4 bg-[var(--sl-border-subtle)]" />

            {/* Actions */}
            <div className="flex items-center gap-1">
                <button
                    onClick={onExport}
                    className="p-1.5 hover:bg-[var(--sl-bg-hover)] rounded text-[var(--sl-fg-muted)] hover:text-[var(--sl-fg-primary)] transition-colors"
                    title="Export (JSON)"
                >
                    <DownloadIcon size={14} />
                </button>
                <button
                    onClick={onClear}
                    className="p-1.5 hover:bg-[var(--sl-bg-hover)] rounded text-[var(--sl-fg-muted)] hover:text-[var(--sl-fg-primary)] transition-colors"
                    title="Clear"
                >
                    <ClearIcon size={14} />
                </button>
            </div>
        </div>
    )
}
