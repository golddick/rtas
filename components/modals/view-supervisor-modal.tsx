// components/modals/view-supervisor-modal.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mail, Phone, MapPin, Award, BookOpen, Users, Calendar, MessageSquare } from 'lucide-react'

interface ViewSupervisorModalProps {
  isOpen: boolean
  onClose: () => void
  onMessage: () => void
  supervisor: {
    id: string | number
    name: string
    email: string
    phone?: string
    office?: string
    department?: string
    specialization?: string
    bio?: string
    availability?: string
    students?: number
    publications?: number
    yearsExperience?: number
  }
}

export function ViewSupervisorModal({ isOpen, onClose, onMessage, supervisor }: ViewSupervisorModalProps) {
  if (!supervisor) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Supervisor Profile</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
              <h3 className="text-xl font-semibold text-foreground">{supervisor.name}</h3>
              {supervisor.department && (
                <p className="text-sm text-muted-foreground mt-1">{supervisor.department}</p>
              )}
              {supervisor.specialization && (
                <p className="text-sm text-primary mt-1">Specialization: {supervisor.specialization}</p>
              )}
            </div>

            {/* Contact Information */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-primary" />
                    <a href={`mailto:${supervisor.email}`} className="hover:text-primary transition-colors">
                      {supervisor.email}
                    </a>
                  </div>
                  {supervisor.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={16} className="text-primary" />
                      <span>{supervisor.phone}</span>
                    </div>
                  )}
                  {supervisor.office && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin size={16} className="text-primary" />
                      <span>{supervisor.office}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Professional Info */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4">Professional Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {supervisor.students !== undefined && (
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-primary" />
                      <span className="text-sm">Students: <span className="font-semibold">{supervisor.students}</span></span>
                    </div>
                  )}
                  {supervisor.publications !== undefined && (
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-primary" />
                      <span className="text-sm">Publications: <span className="font-semibold">{supervisor.publications}</span></span>
                    </div>
                  )}
                  {supervisor.yearsExperience !== undefined && (
                    <div className="flex items-center gap-2">
                      <Award size={16} className="text-primary" />
                      <span className="text-sm">Experience: <span className="font-semibold">{supervisor.yearsExperience}+ years</span></span>
                    </div>
                  )}
                  {supervisor.availability && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-primary" />
                      <span className="text-sm">Office Hours: <span className="font-semibold">{supervisor.availability}</span></span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bio */}
            {supervisor.bio && (
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2">Biography</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{supervisor.bio}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onMessage} className="gap-2">
            <MessageSquare size={16} />
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


// 'use client'

// import { Button } from '@/components/ui/button'
// import { X, Mail, Phone, MessageSquare, Award, BookOpen } from 'lucide-react'

// interface ViewSupervisorModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onMessage?: () => void
//   supervisor: {
//     id: number
//     name: string
//     email: string
//     phone?: string
//     staffNumber?: string
//     department?: string
//     faculty?: string
//     specialization?: string
//     students?: number
//     approvedTopics?: number
//     status?: string
//   }
// }

// export function ViewSupervisorModal({ isOpen, onClose, onMessage, supervisor }: ViewSupervisorModalProps) {
//   if (!isOpen) return null

//   const getStatusColor = (status?: string) => {
//     switch (status) {
//       case 'ACTIVE': return 'bg-green-100 text-green-700'
//       case 'INACTIVE': return 'bg-gray-100 text-gray-700'
//       case 'PENDING_VERIFICATION': return 'bg-yellow-100 text-yellow-700'
//       case 'SUSPENDED': return 'bg-red-100 text-red-700'
//       default: return 'bg-gray-100 text-gray-700'
//     }
//   }

//   return (
//     <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fade-in">
//       <div className="bg-background rounded-xl border border-border w-full max-w-lg animate-scale-in">
//         {/* Header */}
//         <div className="border-b border-border p-6 flex items-start justify-between">
//           <div className="flex-1">
//             <div className="flex items-center gap-3">
//               <h2 className="text-2xl font-bold text-foreground capitalize">{supervisor.name}</h2>
//               {supervisor.status && (
//                 <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(supervisor.status)}`}>
//                   {supervisor.status}
//                 </span>
//               )}
//             </div>
//             <p className="text-sm text-muted-foreground mt-1">{supervisor.specialization || 'Supervisor'}</p>
//             {supervisor.staffNumber && (
//               <p className="text-xs text-muted-foreground mt-1">Staff #{supervisor.staffNumber}</p>
//             )}
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-secondary rounded-lg transition-colors"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="p-6 space-y-6">
//           {/* Contact Information */}
//           <div className="space-y-3">
//             <h3 className="text-sm font-semibold text-foreground">Contact Information</h3>
//             {supervisor.email && (
//               <div className="flex items-center gap-3 text-sm text-muted-foreground">
//                 <Mail size={16} className="text-primary" />
//                 <a href={`mailto:${supervisor.email}`} className="hover:text-primary transition-colors">
//                   {supervisor.email}
//                 </a>
//               </div>
//             )}
//             {supervisor.phone && (
//               <div className="flex items-center gap-3 text-sm text-muted-foreground">
//                 <Phone size={16} className="text-primary" />
//                 <a href={`tel:${supervisor.phone}`} className="hover:text-primary transition-colors">
//                   {supervisor.phone}
//                 </a>
//               </div>
//             )}
//           </div>

//           {/* Academic Info */}
//           {(supervisor.department || supervisor.faculty) && (
//             <div className="bg-secondary rounded-lg p-4 space-y-3">
//               {supervisor.department && (
//                 <div>
//                   <p className="text-xs text-muted-foreground mb-1">Department</p>
//                   <p className="font-semibold text-foreground">{supervisor.department}</p>
//                 </div>
//               )}
//               {supervisor.faculty && (
//                 <div>
//                   <p className="text-xs text-muted-foreground mb-1">Faculty</p>
//                   <p className="font-semibold text-foreground">{supervisor.faculty}</p>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Statistics */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="bg-secondary rounded-lg p-4 text-center">
//               <Award size={24} className="mx-auto mb-2 text-primary" />
//               <p className="text-2xl font-bold text-foreground">{supervisor.students || 0}</p>
//               <p className="text-xs text-muted-foreground">Students</p>
//             </div>
//             <div className="bg-secondary rounded-lg p-4 text-center">
//               <BookOpen size={24} className="mx-auto mb-2 text-primary" />
//               <p className="text-2xl font-bold text-foreground">{supervisor.approvedTopics || 0}</p>
//               <p className="text-xs text-muted-foreground">Approved Topics</p>
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="border-t border-border p-6 flex items-center justify-end gap-3">
//           <Button variant="outline" onClick={onClose}>
//             Close
//           </Button>
//           <Button onClick={onMessage} className="gap-2">
//             <MessageSquare size={16} />
//             Send Message
//           </Button>
//         </div>
//       </div>
//     </div>
//   )
// }