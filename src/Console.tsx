'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { getIcon } from './icons'

interface LogEntry {
  id: string
  timestamp: Date
  level: 'log' | 'warn' | 'error'
  args: any[]
  stack?: string
}

interface ConsoleProps {
  logs: LogEntry[]
  onClear: () => void
  isBooted?: boolean
}

export function Console({ logs, onClear, isBooted = true }: ConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState({ log: true, warn: true, error: true })
  const [isAutoScroll, setIsAutoScroll] = useState(true)

  // Icons
  const ClearIcon = getIcon('Clear')
  const SearchIcon = getIcon('Search')
  const CopyIcon = getIcon('Copy')

  // Counts
  const counts = useMemo(() => logs.reduce((acc, log) => {
    acc[log.level]++
    return acc
  }, { log: 0, warn: 0, error: 0 }), [logs])

  // Auto-scroll
  useEffect(() => {
    if (isAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, filter, searchTerm, isAutoScroll])

  // Filter
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (!filter[log.level]) return false
      if (searchTerm) {
        const content = log.args.map(formatValue).join(' ').toLowerCase()
        return content.includes(searchTerm.toLowerCase())
      }
      return true
    })
  }, [logs, filter, searchTerm])

  function formatValue(value: any): string {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'object') {
      try { return JSON.stringify(value, null, 2) } catch { return String(value) }
    }
    return String(value)
  }

  const copyLogs = async () => {
    const text = logs.map(l => `[${l.timestamp.toISOString()}] ${l.level.toUpperCase()}: ${l.args.map(formatValue).join(' ')}`).join('\n')
    await navigator.clipboard.writeText(text)
  }

  if (!isBooted) return null

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] text-[#d4d4d4] font-['JetBrains_Mono',_'Fira_Code',_'Consolas',_monospace] text-[13px]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#252526] border-b border-[#404040]">
        {/* Search */}
        <div className="flex-1 flex items-center gap-2 bg-[#3c3c3c] border border-[#555] focus-within:border-[#0078d4] rounded px-2 py-1">
          <SearchIcon size={14} className="text-[#808080]" />
          <input
            className="bg-transparent text-[12px] text-[#d4d4d4] w-full focus:outline-none placeholder-[#808080]"
            placeholder="Filter logs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter(f => ({ ...f, log: !f.log }))}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${filter.log
                ? 'bg-[#0e639c] text-white'
                : 'bg-[#3c3c3c] text-[#808080] hover:bg-[#4a4a4a]'
              }`}
          >
            {counts.log} Log
          </button>
          <button
            onClick={() => setFilter(f => ({ ...f, warn: !f.warn }))}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${filter.warn
                ? 'bg-[#b89500] text-[#1e1e1e]'
                : 'bg-[#3c3c3c] text-[#808080] hover:bg-[#4a4a4a]'
              }`}
          >
            {counts.warn} Warn
          </button>
          <button
            onClick={() => setFilter(f => ({ ...f, error: !f.error }))}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${filter.error
                ? 'bg-[#c24038] text-white'
                : 'bg-[#3c3c3c] text-[#808080] hover:bg-[#4a4a4a]'
              }`}
          >
            {counts.error} Err
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 border-l border-[#404040] pl-3">
          <button onClick={copyLogs} className="p-1.5 hover:bg-[#3c3c3c] rounded text-[#808080] hover:text-[#d4d4d4] transition-colors" title="Copy All">
            <CopyIcon size={14} />
          </button>
          <button onClick={onClear} className="p-1.5 hover:bg-[#3c3c3c] rounded text-[#808080] hover:text-[#d4d4d4] transition-colors" title="Clear">
            <ClearIcon size={14} />
          </button>
        </div>
      </div>

      {/* Log Stream */}
      <div
        ref={scrollRef}
        onScroll={() => {
          if (!scrollRef.current) return
          const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
          setIsAutoScroll(scrollHeight - scrollTop - clientHeight < 50)
        }}
        className="flex-1 overflow-y-auto selection:bg-[#264f78]"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-[#808080] text-[12px] p-4">No logs to display.</div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-4 py-1 px-4 hover:bg-[#2a2a2a] border-l-3 transition-colors ${log.level === 'error' ? 'border-l-[#f14c4c] bg-[#2d1515]' :
                  log.level === 'warn' ? 'border-l-[#cca700] bg-[#2d2a15]' :
                    'border-l-transparent'
                }`}
            >
              {/* Timestamp */}
              <span className="text-[#6a9955] text-[11px] shrink-0 select-none tabular-nums font-medium">
                {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>

              {/* Level Badge */}
              <span className={`text-[10px] font-bold uppercase shrink-0 w-10 text-center py-0.5 rounded ${log.level === 'error' ? 'bg-[#f14c4c] text-[#1e1e1e]' :
                  log.level === 'warn' ? 'bg-[#cca700] text-[#1e1e1e]' :
                    'bg-[#0e639c] text-white'
                }`}>
                {log.level === 'error' ? 'ERR' : log.level === 'warn' ? 'WARN' : 'LOG'}
              </span>

              {/* Message */}
              <div className={`flex-1 break-words whitespace-pre-wrap leading-relaxed ${log.level === 'error' ? 'text-[#f48771]' :
                  log.level === 'warn' ? 'text-[#dcdcaa]' :
                    'text-[#d4d4d4]'
                }`}>
                {log.args.map((arg, i) => (
                  <span key={i} className="mr-1">{formatValue(arg)}</span>
                ))}
                {log.stack && (
                  <details className="mt-2">
                    <summary className="text-[#808080] text-[11px] cursor-pointer hover:text-[#d4d4d4]">Stack trace</summary>
                    <pre className="text-[#f48771]/70 text-[10px] mt-1 pl-4 border-l-2 border-[#f14c4c]/30 overflow-x-auto">
                      {log.stack.split('\n').slice(1, 6).join('\n')}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}