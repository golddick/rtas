'use client'

import { useState, useEffect } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Supervisor } from '@/store/hod/supervisor/type/supervisor'

interface AllocateSupervisorModalProps {
  isOpen: boolean
  onClose: () => void
  studentName: string
  studentId?: string
  supervisors: Supervisor[]
  isLoading?: boolean
  onAllocate: (supervisorId: string, supervisorName: string) => Promise<void> | void
}

export function AllocateSupervisorModal({
  isOpen,
  onClose,
  studentName,
  studentId,
  supervisors,
  isLoading = false,
  onAllocate,
}: AllocateSupervisorModalProps) {
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null)
  const [isAllocating, setIsAllocating] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setSelectedSupervisor(null)
      setIsAllocating(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleAllocate = async () => {
    if (selectedSupervisor) {
      const supervisor = supervisors.find(s => s.id === selectedSupervisor)
      if (supervisor) {
        setIsAllocating(true)
        try {
          await onAllocate(selectedSupervisor, supervisor.fullName)
          setSelectedSupervisor(null)
        } catch (error) {
          console.error('Allocation failed:', error)
        } finally {
          setIsAllocating(false)
        }
      }
    }
  }

  const getAvailabilityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Show loading state when fetching supervisors
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <Card className="w-full max-w-md animate-scale-in">
          <CardHeader className="sticky top-0 bg-background border-b flex items-center justify-between">
            <div>
              <CardTitle>Loading Supervisors</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Please wait...</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <X size={20} />
            </button>
          </CardHeader>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Fetching available supervisors...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <CardHeader className="sticky top-0 bg-background border-b flex items-center justify-between">
          <div>
            <CardTitle>Allocate Supervisor</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Select a supervisor for {studentName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X size={20} />
          </button>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {supervisors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No supervisors available</p>
              <p className="text-xs text-muted-foreground mt-2">
                Please add supervisors to your department first.
              </p>
            </div>
          ) : (
            <>
              {/* Available Supervisors List */}
              <div className="space-y-3">
                {supervisors.map((supervisor) => {
                  const studentCount = supervisor.studentCount || 0
                  const maxCapacity = supervisor.maxCapacity || 15
                  const isAvailable = studentCount < maxCapacity
                  
                  return (
                    <div
                      key={supervisor.id}
                      onClick={() => isAvailable && !isAllocating && setSelectedSupervisor(supervisor.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        !isAvailable ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
                      } ${
                        selectedSupervisor === supervisor.id
                          ? 'border-primary bg-blue-50'
                          : 'border-border hover:border-primary/50'
                      } ${isAllocating ? 'cursor-wait opacity-70' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-foreground capitalize">{supervisor.fullName}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {supervisor.department?.name || 'Department'} • {supervisor.staffNumber || 'No Staff #'}
                          </p>
                          {supervisor.faculty && (
                            <p className="text-xs text-muted-foreground mt-1 capitalize">
                              Faculty: {supervisor.faculty}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {studentCount}/{maxCapacity} students
                          </p>
                          <div className="w-24 h-2 bg-secondary rounded-full mt-1">
                            <div
                              className={`h-2 rounded-full transition-all ${getAvailabilityColor(studentCount, maxCapacity)}`}
                              style={{
                                width: `${(studentCount / maxCapacity) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        {selectedSupervisor === supervisor.id && (
                          <div className="p-2 bg-green-100 rounded-full">
                            <Check size={20} className="text-green-700" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className="flex-1"
                  disabled={isAllocating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAllocate}
                  disabled={!selectedSupervisor || isAllocating}
                  className="flex-1"
                >
                  {isAllocating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Allocating...
                    </>
                  ) : (
                    'Allocate Supervisor'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}