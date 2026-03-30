'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { X, Copy, Trash2, ChevronDown } from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: string
  type: 'info' | 'error' | 'warning' | 'success'
  message: string
  details?: string
}

export function DebugConsole() {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'Debug console initialized',
      details: 'System ready for debugging',
    },
  ])

  const addLog = (type: LogEntry['type'], message: string, details?: string) => {
    const newLog: LogEntry = {
      id: String(logs.length + 1),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details,
    }
    setLogs([...logs, newLog])
  }

  const copyLogs = () => {
    const logsText = logs.map(l => `[${l.timestamp}] ${l.type.toUpperCase()}: ${l.message}`).join('\n')
    navigator.clipboard.writeText(logsText)
    addLog('success', 'Logs copied to clipboard')
  }

  const clearLogs = () => {
    setLogs([])
    addLog('info', 'Console cleared')
  }

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'success':
        return 'text-green-600'
      default:
        return 'text-blue-600'
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 px-4 py-2 bg-primary text-white rounded-lg shadow-lg hover:bg-primary/90 transition-all duration-300 text-sm font-medium z-50"
      >
        Debug Console {logs.length > 0 && `(${logs.length})`}
      </button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-80 shadow-2xl z-50 animate-slide-up">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Debug Console</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          <X size={16} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-secondary rounded-lg p-3 overflow-y-auto max-h-48 text-xs font-mono space-y-1">
          {logs.length === 0 ? (
            <p className="text-muted-foreground">No logs yet</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="space-y-0.5">
                <p className={`${getLogColor(log.type)}`}>
                  [{log.timestamp}] {log.type.toUpperCase()}: {log.message}
                </p>
                {log.details && <p className="text-muted-foreground ml-4">{log.details}</p>}
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={copyLogs}>
            <Copy size={14} className="mr-1" />
            Copy
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={clearLogs}>
            <Trash2 size={14} className="mr-1" />
            Clear
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Quick test commands:</p>
          <button className="block text-blue-600 hover:underline" onClick={() => addLog('info', 'Test info message')}>
            → Test Info
          </button>
          <button className="block text-yellow-600 hover:underline" onClick={() => addLog('warning', 'Test warning')}>
            → Test Warning
          </button>
          <button className="block text-red-600 hover:underline" onClick={() => addLog('error', 'Test error')}>
            → Test Error
          </button>
          <button className="block text-green-600 hover:underline" onClick={() => addLog('success', 'Test success')}>
            → Test Success
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
