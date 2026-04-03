// lib/upload.ts
export interface UploadResponse {
  success: boolean
  data?: {
    id: string
    name: string
    size: number
    mimeType: string
    url: string
    directUrl: string
    createdAt: string
  }
  error?: string
}

const DROPAPI_BASE = process.env.NEXT_PUBLIC_DROPAPHI_URL || 'https://dropaphi.vercel.app/api/v1'
const DROPAPI_KEY = process.env.DROPAPHI_API_KEY || 'da_test__dtHFb0DfG'

export async function uploadFile(file: File, metadata?: {
  folder?: string
  filename?: string
  description?: string
}): Promise<UploadResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }

    const response = await fetch(`${DROPAPI_BASE}/files/upload`, {
      method: 'POST',
      headers: {
        'X-API-Key': DROPAPI_KEY || ''
      },
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to upload file'
      }
    }

    return {
      success: true,
      data: result.data
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}