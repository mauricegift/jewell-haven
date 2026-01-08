import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Shield, ShieldOff, Users, Loader2, Edit, Save, X, Mail, Phone as PhoneIcon, Calendar, Filter, MoreVertical, UserPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminLayout } from "./AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface EditUserForm {
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({
    name: "",
    email: "",
    phone: "",
    isVerified: false
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    admins: 0,
    users: 0
  });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  useEffect(() => {
    if (users) {
      const total = users.length;
      const verified = users.filter(u => u.isVerified).length;
      const admins = users.filter(u => u.role === "admin" || u.role === "superadmin").length;
      const regularUsers = users.filter(u => u.role === "user").length;
      
      setStats({
        total,
        verified,
        admins,
        users: regularUsers
      });
    }
  }, [users]);

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not update role",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: Partial<User> }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User updated",
        description: "User details have been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not update user",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      isVerified: user.isVerified
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingUser) return;
    
    updateUserMutation.mutate({
      userId: editingUser.id,
      data: {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        isVerified: editForm.isVerified
      }
    });
  };

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "superadmin":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  const isSuperAdmin = currentUser?.role === "superadmin";
  const canEditUser = (user: User) => {
    return isSuperAdmin && user.id !== currentUser?.id && user.role !== "superadmin";
  };

  const exportUsers = () => {
    if (!users) return;
    
    const csvContent = [
      ["Name", "Email", "Phone", "Role", "Verified", "Joined Date"],
      ...users.map(user => [
        user.name,
        user.email,
        user.phone || "",
        user.role,
        user.isVerified ? "Yes" : "No",
        new Date(user.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: "User data has been exported as CSV.",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Users</h1>
              <p className="text-sm md:text-base text-muted-foreground">Manage user accounts, roles, and details</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportUsers}
                className="gap-2"
                disabled={!users || users.length === 0}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Verified</p>
                      <p className="text-2xl font-bold">{stats.verified}</p>
                    </div>
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Shield className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Admins</p>
                      <p className="text-2xl font-bold">{stats.admins}</p>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Regular Users</p>
                      <p className="text-2xl font-bold">{stats.users}</p>
                    </div>
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <UserPlus className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="overflow-hidden border shadow-sm">
            {/* FIXED: Removed the explicit white background gradient for dark mode compatibility */}
            <CardHeader className="p-4 md:p-6 bg-card">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm md:text-base focus:border-primary transition-colors"
                    data-testid="input-search-users"
                  />
                </div>
                
                <div className="flex gap-2">
                  <div className="sm:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="w-full"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {showFilters ? "Hide Filters" : "Show Filters"}
                    </Button>
                  </div>

                  <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full sm:w-[180px] text-sm md:text-base" data-testid="select-role-filter">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-sm md:text-base">All Roles</SelectItem>
                        <SelectItem value="user" className="text-sm md:text-base">Users</SelectItem>
                        <SelectItem value="admin" className="text-sm md:text-base">Admins</SelectItem>
                        <SelectItem value="superadmin" className="text-sm md:text-base">Super Admins</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {showFilters && roleFilter !== "all" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setRoleFilter("all");
                        }}
                        className="mt-2 sm:hidden w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
              {isLoading ? (
                <div className="space-y-4 p-4 md:p-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                    >
                      <Skeleton className="h-16 w-full" />
                    </motion.div>
                  ))}
                </div>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-sm md:text-base font-semibold">User</TableHead>
                          <TableHead className="text-sm md:text-base font-semibold">Email</TableHead>
                          <TableHead className="text-sm md:text-base font-semibold">Phone</TableHead>
                          <TableHead className="text-sm md:text-base font-semibold">Joined</TableHead>
                          <TableHead className="text-sm md:text-base font-semibold">Status</TableHead>
                          <TableHead className="text-sm md:text-base font-semibold">Role</TableHead>
                          {isSuperAdmin && <TableHead className="text-right text-sm md:text-base font-semibold">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {filteredUsers.map((user, index) => (
                            <motion.tr
                              key={user.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                              // FIXED: Changed from hover:bg-gray-50 to proper dark theme hover
                              className="hover:bg-muted/50 transition-colors"
                              data-testid={`row-user-${user.id}`}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8 ring-2 ring-offset-2 ring-muted">
                                    <AvatarImage src={user.profilePicture || undefined} />
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                                      {user.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-sm md:text-base">{user.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm md:text-base">{user.email}</TableCell>
                              <TableCell className="text-sm md:text-base">{user.phone || "-"}</TableCell>
                              <TableCell className="text-sm md:text-base">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {user.isVerified ? (
                                  <Badge variant="secondary" className="text-xs md:text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-800">
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs md:text-sm">
                                    Unverified
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs md:text-sm">
                                  {user.role === "superadmin"
                                    ? "Super Admin"
                                    : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                              </TableCell>
                              {isSuperAdmin && (
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {canEditUser(user) && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        // FIXED: Changed hover colors for dark mode
                                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                        onClick={() => handleEditClick(user)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {user.id !== currentUser?.id && user.role !== "superadmin" && (
                                      <>
                                        {user.role === "user" ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            // FIXED: Changed hover colors for dark mode
                                            className="gap-2 h-8 text-xs md:text-sm hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                            onClick={() =>
                                              updateRoleMutation.mutate({
                                                userId: user.id,
                                                role: "admin",
                                              })
                                            }
                                            disabled={updateRoleMutation.isPending}
                                            data-testid={`button-make-admin-${user.id}`}
                                          >
                                            <Shield className="h-3 w-3 md:h-4 md:w-4" />
                                            <span className="hidden sm:inline">Make Admin</span>
                                            <span className="sm:hidden">Admin</span>
                                          </Button>
                                        ) : (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            // FIXED: Changed hover colors for dark mode
                                            className="gap-2 h-8 text-xs md:text-sm hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all"
                                            onClick={() =>
                                              updateRoleMutation.mutate({
                                                userId: user.id,
                                                role: "user",
                                              })
                                            }
                                            disabled={updateRoleMutation.isPending}
                                            data-testid={`button-remove-admin-${user.id}`}
                                          >
                                            <ShieldOff className="h-3 w-3 md:h-4 md:w-4" />
                                            <span className="hidden sm:inline">Remove Admin</span>
                                            <span className="sm:hidden">Remove</span>
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3 p-4">
                    <AnimatePresence>
                      {filteredUsers.map((user, index) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <Card className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-0">
                              <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-muted">
                                      <AvatarImage src={user.profilePicture || undefined} />
                                      <AvatarFallback className="text-sm bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                                        {user.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <h3 className="font-medium text-sm truncate">{user.name}</h3>
                                      <Badge variant={getRoleBadgeVariant(user.role)} className="mt-1 text-xs capitalize">
                                        {user.role === "superadmin" ? "Super Admin" : user.role}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  {isSuperAdmin && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="animate-in fade-in-80">
                                        {canEditUser(user) && (
                                          <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Details
                                          </DropdownMenuItem>
                                        )}
                                        {user.id !== currentUser?.id && user.role !== "superadmin" && (
                                          <>
                                            {user.role === "user" ? (
                                              <DropdownMenuItem 
                                                onClick={() =>
                                                  updateRoleMutation.mutate({
                                                    userId: user.id,
                                                    role: "admin",
                                                  })
                                                }
                                              >
                                                <Shield className="h-4 w-4 mr-2" />
                                                Make Admin
                                              </DropdownMenuItem>
                                            ) : (
                                              <DropdownMenuItem 
                                                onClick={() =>
                                                  updateRoleMutation.mutate({
                                                    userId: user.id,
                                                    role: "user",
                                                  })
                                                }
                                              >
                                                <ShieldOff className="h-4 w-4 mr-2" />
                                                Remove Admin
                                              </DropdownMenuItem>
                                            )}
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                                
                                <div className="space-y-2 mb-3">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm truncate">{user.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <PhoneIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm">{user.phone || "No phone"}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm">
                                      Joined {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex justify-between items-center pt-3 border-t">
                                  <div className="flex items-center gap-2">
                                    {user.isVerified ? (
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                        Verified
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">Unverified</Badge>
                                    )}
                                  </div>
                                  
                                  {isSuperAdmin && user.id !== currentUser?.id && user.role !== "superadmin" && (
                                    <div className="flex gap-2">
                                      {user.role === "user" ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          // FIXED: Changed hover colors for dark mode
                                          className="h-7 text-xs hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
                                          onClick={() =>
                                            updateRoleMutation.mutate({
                                              userId: user.id,
                                              role: "admin",
                                            })
                                          }
                                          disabled={updateRoleMutation.isPending}
                                        >
                                          <Shield className="h-3 w-3 mr-1" />
                                          Admin
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          // FIXED: Changed hover colors for dark mode
                                          className="h-7 text-xs hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                                          onClick={() =>
                                            updateRoleMutation.mutate({
                                              userId: user.id,
                                              role: "user",
                                            })
                                          }
                                          disabled={updateRoleMutation.isPending}
                                        >
                                          <ShieldOff className="h-3 w-3 mr-1" />
                                          Remove
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-8 md:py-12 px-4"
                >
                  <Users className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-base md:text-lg font-medium mb-2">No users found</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-4">
                    {searchQuery || roleFilter !== "all" 
                      ? "Try adjusting your search or filter criteria"
                      : "There are no users yet"}
                  </p>
                  {(searchQuery || roleFilter !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setRoleFilter("all");
                      }}
                      // FIXED: Changed hover colors for dark mode
                      className="text-sm hover:bg-muted"
                    >
                      Clear filters
                    </Button>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] w-[95vw] md:w-full animate-in fade-in-80 slide-in-from-bottom-4">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Edit User</DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                Make changes to user details here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="grid gap-4 py-4"
              >
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm md:text-base">Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm md:text-base">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm md:text-base">Phone</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="verified" className="text-sm md:text-base">Account Status</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="verified"
                        checked={editForm.isVerified}
                        onCheckedChange={(checked) => setEditForm({...editForm, isVerified: checked})}
                      />
                      <Label htmlFor="verified" className="text-sm font-medium">
                        {editForm.isVerified ? "Verified" : "Unverified"}
                      </Label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {/* FIXED: Cancel button hover for dark mode */}
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 text-sm md:text-base hover:bg-muted"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleEditSubmit} 
                disabled={updateUserMutation.isPending}
                className="flex-1 text-sm md:text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {updateUserMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}