// 'use client'

// import { useState, useEffect } from 'react'
// import { X } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// import { CreateInstitutionData, Institution } from '@/store/admin/type/institution'


// interface AddInstitutionModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onAdd: (data: CreateInstitutionData) => Promise<void>
//   editingInstitution?: Institution | null
// }

// export function AddInstitutionModal({ 
//   isOpen, 
//   onClose, 
//   onAdd, 
//   editingInstitution 
// }: AddInstitutionModalProps) {
//   const [formData, setFormData] = useState({
//     name: '',
//     code: '',
//     description: '',
//     address: '',
//     website: '',
//     logoUrl: '',
//   })
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState('')

//   useEffect(() => {
//     if (editingInstitution) {
//       setFormData({
//         name: editingInstitution.name || '',
//         code: editingInstitution.code || '',
//         description: editingInstitution.description || '',
//         address: editingInstitution.address || '',
//         website: editingInstitution.website || '',
//         logoUrl: editingInstitution.logoUrl || '',
//       })
//     } else {
//       setFormData({
//         name: '',
//         code: '',
//         description: '',
//         address: '',
//         website: '',
//         logoUrl: '',
//       })
//     }
//     setError('')
//   }, [editingInstitution, isOpen])

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target
//     setFormData(prev => ({ ...prev, [name]: value }))
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setError('')
//     setIsLoading(true)

//     try {
//       await onAdd(formData)
//       onClose()
//     } catch (err: any) {
//       setError(err.message || 'Failed to save institution')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   if (!isOpen) return null

//   return (
//     <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
//       <div className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-lg">
//         <div className="bg-background border rounded-lg shadow-lg">
//           <div className="flex items-center justify-between p-6 border-b">
//             <h2 className="text-lg font-semibold">
//               {editingInstitution ? 'Edit Institution' : 'Add New Institution'}
//             </h2>
//             <button onClick={onClose} className="rounded-sm opacity-70 hover:opacity-100">
//               <X className="h-4 w-4" />
//             </button>
//           </div>

//           <form onSubmit={handleSubmit} className="p-6 space-y-4">
//             {error && (
//               <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
//                 <p className="text-sm text-destructive">{error}</p>
//               </div>
//             )}

//             <div className="space-y-2">
//               <label className="text-sm font-medium">Institution Name *</label>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 required
//                 className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
//                 placeholder="e.g., University of Lagos"
//               />
//             </div>

//             <div className="space-y-2">
//               <label className="text-sm font-medium">Institution Code *</label>
//               <input
//                 type="text"
//                 name="code"
//                 value={formData.code}
//                 onChange={handleChange}
//                 required
//                 className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary uppercase"
//                 placeholder="e.g., UNILAG"
//               />
//             </div>

//             <div className="space-y-2">
//               <label className="text-sm font-medium">Description</label>
//               <textarea
//                 name="description"
//                 value={formData.description}
//                 onChange={handleChange}
//                 rows={3}
//                 className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
//                 placeholder="Brief description of the institution"
//               />
//             </div>

//             <div className="space-y-2">
//               <label className="text-sm font-medium">Address</label>
//               <input
//                 type="text"
//                 name="address"
//                 value={formData.address}
//                 onChange={handleChange}
//                 className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
//                 placeholder="Physical address"
//               />
//             </div>

//             <div className="space-y-2">
//               <label className="text-sm font-medium">Website</label>
//               <input
//                 type="url"
//                 name="website"
//                 value={formData.website}
//                 onChange={handleChange}
//                 className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
//                 placeholder="https://university.edu"
//               />
//             </div>

//             <div className="space-y-2">
//               <label className="text-sm font-medium">Logo URL</label>
//               <input
//                 type="url"
//                 name="logoUrl"
//                 value={formData.logoUrl}
//                 onChange={handleChange}
//                 className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
//                 placeholder="https://example.com/logo.png"
//               />
//             </div>

//             <div className="flex justify-end gap-3 pt-4">
//               <Button type="button" variant="outline" onClick={onClose}>
//                 Cancel
//               </Button>
//               <Button type="submit" disabled={isLoading}>
//                 {isLoading ? 'Saving...' : editingInstitution ? 'Update' : 'Create'}
//               </Button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }




'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateInstitutionData, Institution } from '@/store/admin/type/institution'
import Image from 'next/image'
import { uploadFile } from '@/lib/file/upload'

interface AddInstitutionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: CreateInstitutionData) => Promise<void>
  editingInstitution?: Institution | null
}

export function AddInstitutionModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  editingInstitution 
}: AddInstitutionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: '',
    website: '',
    logoUrl: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingInstitution) {
      setFormData({
        name: editingInstitution.name || '',
        code: editingInstitution.code || '',
        description: editingInstitution.description || '',
        address: editingInstitution.address || '',
        website: editingInstitution.website || '',
        logoUrl: editingInstitution.logoUrl || '',
      })
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        address: '',
        website: '',
        logoUrl: '',
      })
    }
    setError('')
  }, [editingInstitution, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, JPEG, SVG, GIF)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo file size must be less than 5MB')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const result = await uploadFile(file, {
        folder: 'institutions',
        filename: `logo_${formData.code || 'institution'}_${Date.now()}`,
        description: `Logo for ${formData.name || 'institution'}`
      })

      if (result.success && result.data) {
        setFormData(prev => ({ ...prev, logoUrl: result.data!.url }))
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setError(result.error || 'Failed to upload logo')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await onAdd(formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save institution')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-background border rounded-lg shadow-lg">
          <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background">
            <h2 className="text-lg font-semibold">
              {editingInstitution ? 'Edit Institution' : 'Add New Institution'}
            </h2>
            <button onClick={onClose} className="rounded-sm opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Institution Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., University of Lagos"
                disabled={isLoading || isUploading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Institution Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                placeholder="e.g., UNILAG"
                disabled={isLoading || isUploading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Logo</label>
              <div className="space-y-3">
                {/* Logo Preview */}
                {formData.logoUrl && (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
                    <Image
                      src={formData.logoUrl}
                      alt="Institution logo"
                      fill
                      className="object-contain"
                      sizes="(max-width: 128px) 100vw, 128px"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      disabled={isUploading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Upload Area */}
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={isUploading || isLoading}
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer transition-colors ${
                      isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Logo
                      </>
                    )}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, SVG up to 5MB
                  </p>
                </div>

                {/* Logo URL Input (Fallback) */}
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="url"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Or enter logo URL directly"
                    disabled={isLoading || isUploading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Brief description of the institution"
                disabled={isLoading || isUploading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Physical address"
                disabled={isLoading || isUploading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://university.edu"
                disabled={isLoading || isUploading}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {isLoading ? 'Saving...' : editingInstitution ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


