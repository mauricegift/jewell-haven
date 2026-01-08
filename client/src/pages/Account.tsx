import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Camera,
  Loader2,
  Package,
  Settings,
  Eye,
  EyeOff,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  delivered: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function Account() {
  const [location, setLocation] = useLocation();
  const { user, updateUser, logout, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // --- Forms Initialization ---
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { 
      name: user?.name || "", 
      phone: user?.phone || "" 
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  // Ensure profile form updates when user data loads
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        phone: user.phone || ""
      });
    }
  }, [user, profileForm]);

  useEffect(() => {
    const hash = window.location.hash.substring(1) || "profile";
    const validTabs = ["profile", "orders", "settings"];
    if (validTabs.includes(hash)) {
      setActiveTab(hash);
    }
  }, [location]);

  const handleTabChange = (value: string) => {
    setLocation(`/account#${value}`);
    setActiveTab(value);
  };

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (!token && !authLoading) {
        setLocation("/login");
        return;
      }
      setIsCheckingAuth(false);
    };
    checkToken();
  }, [authLoading, setLocation]);

  const { data: orders, isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ["/api/user/orders"],
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => await apiRequest("PATCH", "/api/user/profile", data),
    onSuccess: (data) => {
      updateUser(data.user);
      toast({ title: "Profile updated", description: "Your profile has been updated successfully." });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => await apiRequest("PATCH", "/api/user/password", { currentPassword: data.currentPassword, newPassword: data.newPassword }),
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const uploadPictureMutation = useMutation({
    mutationFn: async (base64: string) => await apiRequest("PATCH", "/api/user/picture", { picture: base64 }),
    onSuccess: (data) => {
      updateUser(data.user);
      toast({ title: "Picture updated", description: "Your profile picture has been updated." });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast({ title: "File too large", variant: "destructive" });
    const reader = new FileReader();
    reader.onloadend = () => uploadPictureMutation.mutate(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (isCheckingAuth || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-6">Authentication Required</h2>
          <Button onClick={() => setLocation("/login")}>Log In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 md:py-8 bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
          My Account
        </h1>

        <div className="space-y-8">
          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4 hidden sm:inline" /> Profile
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <Package className="h-4 w-4 hidden sm:inline" /> Orders
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4 hidden sm:inline" /> Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Tab Content Areas - Flowing layout to prevent cropping */}
          <div className="space-y-6">
            
            {/* --- PROFILE TAB --- */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Card>
                  <CardHeader><CardTitle>Profile Picture</CardTitle></CardHeader>
                  <CardContent className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={user.profilePicture || undefined} />
                        <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-md hover:scale-110 transition-transform"
                      >
                        {uploadPictureMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="mt-2 capitalize">
                        {user.role}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input {...profileForm.register("name")} placeholder="Your Name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input {...profileForm.register("phone")} placeholder="e.g. 0712345678" />
                        </div>
                      </div>
                      <Button type="submit" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* --- ORDERS TAB --- */}
            {activeTab === "orders" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>View your recent orders and their status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : orders && orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map((order: any) => (
                          <div 
                            key={order.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-all cursor-pointer group"
                            onClick={() => setLocation(`/account/orders/${order.orderNumber}`)}
                          >
                            <div className="space-y-1">
                              <p className="font-bold">Order #{order.orderNumber}</p>
                              <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right hidden sm:block">
                                <p className="font-bold text-primary">KSh {parseFloat(order.total).toLocaleString()}</p>
                              </div>
                              <Badge className={cn(statusColors[order.status] || "bg-secondary", "capitalize")}>
                                {order.status}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                        <p className="text-muted-foreground">No orders yet.</p>
                        <Button variant="outline" className="mt-4" onClick={() => setLocation("/shop")}>Start Shopping</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* --- SETTINGS TAB --- */}
            {activeTab === "settings" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Card>
                  <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={passwordForm.handleSubmit((data) => updatePasswordMutation.mutate(data))} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Current Password</Label>
                        <div className="relative">
                          <Input type={showCurrentPassword ? "text" : "password"} {...passwordForm.register("currentPassword")} />
                          <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <div className="relative">
                          <Input type={showNewPassword ? "text" : "password"} {...passwordForm.register("newPassword")} />
                          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm New Password</Label>
                        <Input type="password" {...passwordForm.register("confirmPassword")} />
                      </div>
                      <Button type="submit" disabled={updatePasswordMutation.isPending}>
                        {updatePasswordMutation.isPending ? "Updating..." : "Change Password"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* DANGER ZONE - Fixed height and padding to ensure visibility */}
                <Card className="border-destructive/50 mb-10">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Actions here cannot be undone</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <Button 
                      variant="destructive" 
                      className="w-full sm:w-auto"
                      onClick={() => { logout(); setLocation("/"); }}
                    >
                      Log Out of Account
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}