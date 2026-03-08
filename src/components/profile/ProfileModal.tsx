'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, User, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user?.name) {
      setName(user.name)
    }
  }, [user])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (response.ok) {
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully.',
        })
        onOpenChange(false)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            View and update your account information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-3">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              {user?.image ? (
                <img 
                  src={user.image} 
                  alt={user.name || 'Profile'} 
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user?.email}</span>
              </div>
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {user?.email?.includes('gmail') || user?.image ? 'Google Account' : 'Email Account'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
