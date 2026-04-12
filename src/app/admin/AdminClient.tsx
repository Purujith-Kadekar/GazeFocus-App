'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Shield, 
  User as UserIcon, 
  Settings, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  LogOut
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export default function AdminClient() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      router.push('/admin/login')
    } catch {
      toast.error('Logout failed')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        toast.error('Failed to load users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Connection error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    setUpdatingUserId(userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
        toast.success(`User role updated to ${newRole}`)
      } else {
        toast.error('Failed to update role')
      }
    } catch (error) {
      toast.error('Update failed')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const filteredUsers = users.filter(user => 
    (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     user.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold tracking-tight text-amber-400">
              Admin Portal
            </h1>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="border-slate-600 hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          <p className="text-slate-400">
            Manage user roles and priority access for GazeFocus App.
          </p>
        </div>

        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Total {users.length} registered users
                </CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by email or name..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-background/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-muted-foreground">Loading users...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                        No users found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                              {user.image ? (
                                <Image src={user.image} alt={user.name || ''} width={36} height={36} className="h-full w-full object-cover" />
                              ) : (
                                <UserIcon className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <span className="font-medium">{user.name || 'Anonymous'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="px-2.5 py-0.5">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            disabled={updatingUserId === user.id}
                            value={user.role}
                            onValueChange={(val: 'USER' | 'ADMIN') => handleRoleChange(user.id, val)}
                          >
                            <SelectTrigger className="w-28 ml-auto">
                              {updatingUserId === user.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                              ) : null}
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">USER</SelectItem>
                              <SelectItem value="ADMIN">ADMIN</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/20 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary">Admin Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Admins have unlimited quota usage and can manage all system settings.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/5 border-blue-500/20 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Priority Quota</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Admins are prioritized when the system reaches daily global YouTube API limits.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/5 border-orange-500/20 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-600">System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Detailed audit logs for role changes are stored for security auditing.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
