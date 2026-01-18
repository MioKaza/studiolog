'use client'

import React, { useState, useRef, useEffect } from 'react'

interface CommandBarProps {
    onCommand: (command: string) => void
}

export function CommandBar({ onCommand }: CommandBarProps) {
    const [input, setInput] = useState('')
    const [history, setHistory] = useState<string[]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && input.trim()) {
            onCommand(input.trim())
            setHistory(prev => [...prev, input.trim()])
            setInput('')
            setHistoryIndex(-1)
        }

        // History navigation
        if (e.key === 'ArrowUp' && history.length > 0) {
            e.preventDefault()
            const newIndex = Math.min(historyIndex + 1, history.length - 1)
            setHistoryIndex(newIndex)
            setInput(history[history.length - 1 - newIndex] || '')
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1
                setHistoryIndex(newIndex)
                setInput(history[history.length - 1 - newIndex] || '')
            } else {
                setHistoryIndex(-1)
                setInput('')
            }
        }
    }

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    return (
        <div
            className="flex items-center px-4 py-2 cursor-text shrink-0"
            style={{ backgroundColor: 'var(--sl-bg)', borderTop: '1px solid var(--sl-bg-lighter)' }}
            onClick={() => inputRef.current?.focus()}
        >
            <div className="flex items-center shrink-0 mr-2 select-none text-[13px]">
                <span className="sl-bold" style={{ color: 'var(--sl-pink)' }}>studio</span>
                <span style={{ color: 'var(--sl-fg-dim)' }}>@</span>
                <span className="sl-bold" style={{ color: 'var(--sl-cyan)' }}>log</span>
                <span style={{ color: 'var(--sl-green)' }} className="ml-1">❯</span>
            </div>

            <div className="relative flex-1 flex items-center">
                <input
                    ref={inputRef}
                    type="text"
                    spellCheck={false}
                    autoComplete="off"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-[13px]"
                    style={{ color: 'var(--sl-fg)', caretColor: 'var(--sl-green)' }}
                    placeholder="type 'help' for commands"
                />
            </div>
        </div>
    )
}
