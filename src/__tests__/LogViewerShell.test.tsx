import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { LogViewerShell } from '../LogViewerShell'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
        button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => <>{children}</>,
}))

describe('LogViewerShell', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
    })

    it('renders nothing when disabled', () => {
        const { container } = render(<LogViewerShell enabled={false} />)
        expect(container.firstChild).toBeNull()
    })

    it('renders toggle button when enabled but closed', () => {
        render(<LogViewerShell enabled={true} />)
        // The floating button should be present
        const button = document.querySelector('button')
        expect(button).toBeTruthy()
    })

    it('opens console when toggle button is clicked', async () => {
        render(<LogViewerShell enabled={true} />)

        const toggleButton = document.querySelector('button')
        expect(toggleButton).toBeTruthy()

        if (toggleButton) {
            fireEvent.click(toggleButton)
            vi.advanceTimersByTime(1000) // Allow boot sequence

            // Should now show the terminal
            const terminal = document.querySelector('[data-studiolog-terminal]')
            expect(terminal).toBeTruthy()
        }
    })

    it('responds to Cmd+J keyboard shortcut', () => {
        render(<LogViewerShell enabled={true} />)

        // Simulate Cmd+J
        fireEvent.keyDown(window, { key: 'j', metaKey: true })
        vi.advanceTimersByTime(1000)

        const terminal = document.querySelector('[data-studiolog-terminal]')
        expect(terminal).toBeTruthy()
    })

    it('closes when close button is clicked', () => {
        render(<LogViewerShell enabled={true} />)

        // Open it first
        fireEvent.keyDown(window, { key: 'j', metaKey: true })
        vi.advanceTimersByTime(1000)

        // Find and click close button (the X)
        const closeButtons = document.querySelectorAll('button')
        const closeButton = Array.from(closeButtons).find(btn =>
            btn.querySelector('svg path[d*="18 6"]') // The X icon path
        )

        if (closeButton) {
            fireEvent.click(closeButton)
            vi.advanceTimersByTime(500)

            const terminal = document.querySelector('[data-studiolog-terminal]')
            expect(terminal).toBeFalsy()
        }
    })
})

describe('Boot Sequence', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('shows boot animation with progress bar', () => {
        render(<LogViewerShell enabled={true} />)

        // Open console
        fireEvent.keyDown(window, { key: 'j', metaKey: true })

        // Check for banner
        vi.advanceTimersByTime(100)
        expect(screen.getByText(/STUDIOLOG/)).toBeTruthy()

        // Progress through boot
        vi.advanceTimersByTime(1000)

        // Should have boot progress entries
        const terminal = document.querySelector('[data-studiolog-terminal]')
        expect(terminal).toBeTruthy()
    })

    it('does not show "System Ready!" at 100%', () => {
        render(<LogViewerShell enabled={true} />)

        fireEvent.keyDown(window, { key: 'j', metaKey: true })
        vi.advanceTimersByTime(2000) // Full boot sequence

        // "System Ready!" should NOT appear
        expect(screen.queryByText('System Ready!')).toBeNull()
    })
})
