// components/document-viewer.tsx - Fix the DocumentViewer component
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Maximize2, Minimize2 } from 'lucide-react'

interface DocumentViewerProps {
  title: string
  documentUrl: string  // Changed from fileUrl to documentUrl
  fileName?: string
  fileType?: string
}

export function DocumentViewer({ title, documentUrl, fileName, fileType }: DocumentViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleDownload = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank')
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : 'h-full'}`}>
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Download
          </Button>
          <Button onClick={toggleFullscreen} variant="outline" size="sm">
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <iframe
          src={documentUrl}
          className="w-full h-full border-0 rounded-lg"
          title={fileName || title}
        />
      </div>
    </div>
  )
}