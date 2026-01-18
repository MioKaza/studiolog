import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { consoleProxy } from '../utils/consoleProxy'

describe('ConsoleProxy', () => {
    let originalLog: typeof console.log
    let originalWarn: typeof console.warn
    let originalError: typeof console.error

    beforeEach(() => {
        vi.useFakeTimers()
        // Store originals
        originalLog = console.log
        originalWarn = console.warn
        originalError = console.error
    })

    afterEach(() => {
        vi.useRealTimers()
        // Restore originals
        console.log = originalLog
        console.warn = originalWarn
        console.error = originalError
    })

    it('captures console.log calls', async () => {
        const callback = vi.fn()
        const cleanup = consoleProxy.init(callback)

        console.log('Test message')
        vi.advanceTimersByTime(10)

        expect(callback).toHaveBeenCalledTimes(1)
        expect(callback).toHaveBeenCalledWith(
            expect.objectContaining({
                level: 'log',
                args: expect.arrayContaining(['Test message']),
            })
        )

        cleanup()
    })

    it('captures console.warn calls', async () => {
        const callback = vi.fn()
        const cleanup = consoleProxy.init(callback)

        console.warn('Warning message')
        vi.advanceTimersByTime(10)

        expect(callback).toHaveBeenCalledWith(
            expect.objectContaining({
                level: 'warn',
                args: expect.arrayContaining(['Warning message']),
            })
        )

        cleanup()
    })

    it('captures console.error calls with stack trace', async () => {
        const callback = vi.fn()
        const cleanup = consoleProxy.init(callback)

        console.error('Error message')
        vi.advanceTimersByTime(10)

        expect(callback).toHaveBeenCalledWith(
            expect.objectContaining({
                level: 'error',
                args: expect.arrayContaining(['Error message']),
                stack: expect.any(String),
            })
        )

        cleanup()
    })

    it('generates unique IDs for each log entry', async () => {
        const callback = vi.fn()
        const cleanup = consoleProxy.init(callback)

        console.log('First')
        console.log('Second')
        vi.advanceTimersByTime(10)

        const calls = callback.mock.calls
        expect(calls[0][0].id).not.toBe(calls[1][0].id)

        cleanup()
    })

    it('safely handles circular references in objects', async () => {
        const callback = vi.fn()
        const cleanup = consoleProxy.init(callback)

        const circularObj: Record<string, unknown> = { name: 'test' }
        circularObj.self = circularObj

        console.log(circularObj)
        vi.advanceTimersByTime(10)

        // Should not throw and should still call callback
        expect(callback).toHaveBeenCalled()

        cleanup()
    })

    it('strips ANSI escape codes from strings', async () => {
        const callback = vi.fn()
        const cleanup = consoleProxy.init(callback)

        console.log('\x1b[31mRed text\x1b[0m')
        vi.advanceTimersByTime(10)

        expect(callback).toHaveBeenCalledWith(
            expect.objectContaining({
                args: expect.arrayContaining(['Red text']),
            })
        )

        cleanup()
    })

    it('cleans up and restores original console on cleanup', () => {
        const callback = vi.fn()
        const cleanup = consoleProxy.init(callback)

        cleanup()

        // After cleanup, console should be restored
        // Logging should no longer trigger the callback
        console.log('After cleanup')
        vi.advanceTimersByTime(10)

        // Callback should not have been called for "After cleanup"
        const afterCleanupCalls = callback.mock.calls.filter(
            (call: unknown[]) => (call[0] as { args: string[] }).args.includes('After cleanup')
        )
        expect(afterCleanupCalls.length).toBe(0)
    })

    it('handles multiple callbacks', async () => {
        const callback1 = vi.fn()
        const callback2 = vi.fn()

        const cleanup1 = consoleProxy.init(callback1)
        const cleanup2 = consoleProxy.init(callback2)

        console.log('Multi-callback test')
        vi.advanceTimersByTime(10)

        expect(callback1).toHaveBeenCalled()
        expect(callback2).toHaveBeenCalled()

        cleanup1()
        cleanup2()
    })
})

describe('ConsoleProxy - Security', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('prevents infinite loops if callback throws', async () => {
        const errorCallback = vi.fn(() => {
            throw new Error('Callback error')
        })
        const cleanup = consoleProxy.init(errorCallback)

        // This should not cause infinite loop or crash
        expect(() => {
            console.log('Test')
            vi.advanceTimersByTime(10)
        }).not.toThrow()

        cleanup()
    })

    it('limits object depth to prevent denial of service', async () => {
        const callback = vi.fn()
        const cleanup = consoleProxy.init(callback)

        // Create deeply nested object
        const deepObj: Record<string, unknown> = {}
        let current = deepObj
        for (let i = 0; i < 100; i++) {
            current.nested = {}
            current = current.nested as Record<string, unknown>
        }

        console.log(deepObj)
        vi.advanceTimersByTime(10)

        // Should still work without hanging
        expect(callback).toHaveBeenCalled()

        cleanup()
    })

    it('limits array size to prevent memory issues', async () => {
        const callback = vi.fn()
        const cleanup = consoleProxy.init(callback)

        const hugeArray = new Array(10000).fill('x')
        console.log(hugeArray)
        vi.advanceTimersByTime(10)

        const clonedArray = callback.mock.calls[0][0].args[0]
        // Should be truncated to reasonable size
        expect(clonedArray.length).toBeLessThanOrEqual(10)

        cleanup()
    })

    it('limits object keys to prevent memory issues', async () => {
        const callback = vi.fn()
        const cleanup = consoleProxy.init(callback)

        const hugeObj: Record<string, string> = {}
        for (let i = 0; i < 1000; i++) {
            hugeObj[`key${i}`] = 'value'
        }

        console.log(hugeObj)
        vi.advanceTimersByTime(10)

        const clonedObj = callback.mock.calls[0][0].args[0]
        // Should be truncated
        expect(Object.keys(clonedObj).length).toBeLessThanOrEqual(11) // 10 + "..."

        cleanup()
    })
})
