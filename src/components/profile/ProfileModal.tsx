'use client'

import { useState, useEffect } from 'react'
import Image from '@/components/ui/StableImage'
import { useAuthStore } from '@/store/useStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, User, Shield, Trash2 } from 'lucide-react'
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [provider, setProvider] = useState<string>('credentials')
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null)

  useEffect(() => {
    if (user?.name) {
      setName(user.name)
    }
  }, [user])

  useEffect(() => {
    if (open) {
      fetch('/api/user/profile')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.provider) {
            setProvider(data.provider)
          }
          setDeletionScheduledAt(data?.deletionScheduledAt || null)
        })
        .catch(() => {})
    }
  }, [open])

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

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        setDeletionScheduledAt(data.deletionScheduledAt)
        toast({
          title: 'Account deletion scheduled',
          description: 'Your account will be permanently deleted in 2 days. You can cancel this from your profile.',
        })
      } else {
        throw new Error('Failed to schedule deletion')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule account deletion. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDeletion = async () => {
    setIsCancelling(true)
    try {
      const response = await fetch('/api/user/delete', {
        method: 'POST',
      })

      if (response.ok) {
        setDeletionScheduledAt(null)
        toast({
          title: 'Deletion cancelled',
          description: 'Your account deletion has been cancelled.',
        })
      } else {
        throw new Error('Failed to cancel deletion')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel deletion. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsCancelling(false)
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
                <Image 
                  src={user.image} 
                  alt={user.name || 'Profile'} 
                  width={80}
                  height={80}
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
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {provider === 'google' ? 'Google Account' : 'Email'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            {deletionScheduledAt ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-destructive font-medium">
                  Account scheduled for deletion on {new Date(deletionScheduledAt).toLocaleDateString()}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelDeletion}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Deletion'
                  )}
                </Button>
              </div>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your account will be scheduled for permanent deletion in 2 days.
                      During this period, you can cancel the deletion by visiting your profile.
                      After 2 days, all your data including playlists, notes, and progress will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        'Delete Account'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <div className="flex gap-3">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
