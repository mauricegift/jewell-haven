import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Mail, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loginSchema, type LoginInput } from "@shared/schema";

export default function Login() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const redirect = params.get("redirect") || "/";
  
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      toast({
        title: "Already logged in",
        description: "You are already logged in.",
      });
      setLocation(redirect);
    }
  }, [user, toast, setLocation, redirect]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response;
    },
    onSuccess: (data) => {
      if (data.requiresVerification) {
        toast({
          title: "Verification required",
          description: "Please verify your account before logging in.",
        });
        setLocation(`/verify?email=${encodeURIComponent(form.getValues("email"))}`);
        return;
      }
      
      login(data.user, data.token);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.name}`,
      });
      setLocation(redirect);
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  // Show loading while checking auth
  if (user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
        <div className="text-center space-y-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h2 className="text-2xl font-bold">Already logged in</h2>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-background via-amber-50/5 to-background animate-gradient">
      <div className="w-full max-w-md space-y-8">
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <Link 
              href="/" 
              className="group transition-transform duration-500 hover:scale-105"
            >
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-amber-200/50 group-hover:border-amber-400 transition-all duration-500 shadow-lg group-hover:shadow-amber-200/30">
                <img 
                  src="/logo.png" 
                  alt="Jewel Haven Logo" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23FBBF24'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='24' fill='white'%3EJH%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-amber-300/50 rounded-full transition-all duration-500 animate-pulse group-hover:animate-none" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </Link>

            <div className="space-y-1">
              <h1 className="font-serif text-2xl font-bold text-primary group-hover:text-amber-600 transition-colors duration-500">
                JEWEL HAVEN
              </h1>
              <p className="text-sm text-amber-600/80 font-medium italic">
                luxury defined
              </p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-lg text-muted-foreground font-medium">
              Welcome back
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-amber-200/30 shadow-xl hover:shadow-2xl transition-all duration-500">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-2xl bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Login
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground group-focus-within:text-amber-500 transition-colors duration-300" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 pr-4 h-11 border-muted-foreground/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive mt-2">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-amber-600 hover:text-amber-700 hover:underline transition-colors duration-300"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground group-focus-within:text-amber-500 transition-colors duration-300" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-11 border-muted-foreground/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-amber-600 transition-colors duration-300 p-1 rounded-full hover:bg-amber-50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive mt-2">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/20 disabled:opacity-50"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 pt-6 border-t border-muted-foreground/10 text-center">
              <p className="text-sm text-muted-foreground">
                New to Jewel Haven?{" "}
                <Link
                  href="/signup"
                  className="text-amber-600 hover:text-amber-700 font-medium hover:underline transition-colors duration-300"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            Your credentials are encrypted and securely stored
          </p>
        </div>
      </div>
    </div>
  );
}