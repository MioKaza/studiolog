'use client'

import React from 'react'

export function TestLogger() {
  const testLogs = () => {
    console.log('Hello from StudioLog! 👋')
    console.info('System status: All systems operational 🚀')
    console.log('Testing object logging:', { user: 'developer', timestamp: new Date() })
    console.warn('Network latency detected (simulated)')
    console.error('Failed to synchronize data: Permission denied')

    // Test nested object
    console.log('Project details:', {
      name: 'TofuKit',
      version: '1.0.0',
      features: ['StudioLog', 'Notes', 'Kanban'],
      metadata: { lastUpdated: new Date().toISOString() }
    })
  }

  return (
    <div className="p-4 bg-gray-900 border border-gray-700 rounded-xl shadow-inner">
      <h3 className="text-lg font-semibold mb-2 text-blue-400">StudioLog Tester</h3>
      <p className="text-sm text-gray-400 mb-4">
        Click to generate styled logs. Open your <b>Browser Console (F12)</b> or <b>System Terminal</b> to see the brand design!
      </p>
      <div className="flex gap-2">
        <button
          onClick={testLogs}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-lg active:scale-95"
        >
          Generate Design Logs
        </button>
        <button
          onClick={() => console.warn("Simulated AI Issue: Low confidence score [AI_HELP]")}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-medium transition-all shadow-lg active:scale-95"
        >
          Simulate AI Issue
        </button>
      </div>
    </div>
  )
}