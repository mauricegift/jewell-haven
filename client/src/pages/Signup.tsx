import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { signupSchema, type SignupInput } from "@shared/schema";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      otpPreference: "email",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupInput) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Account created!",
        description: `A verification code has been sent to your ${form.getValues("otpPreference")}.`,
      });
      setLocation(`/verify?email=${encodeURIComponent(form.getValues("email"))}`);
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupInput) => {
    signupMutation.mutate(data);
  };

  const otpPreference = form.watch("otpPreference");

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-background via-amber-50/5 to-background animate-gradient">
      <div className="w-full max-w-md space-y-8 animate-fade-up animate-once animate-duration-500 animate-ease-out">
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center space-y-4">
            {/* Logo Image */}
            <Link 
              href="/" 
              className="group transition-transform duration-500 hover:scale-105"
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-200/50 group-hover:border-amber-400 transition-all duration-500 shadow-lg group-hover:shadow-amber-200/30">
                <img 
                  src="/logo.png" 
                  alt="Jewel Haven Logo" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23FBBF24'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='24' fill='white'%3EJH%3C/text%3E%3C/svg%3E";
                  }}
                />
                {/* Animated border effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-amber-300/50 rounded-full transition-all duration-500 animate-pulse group-hover:animate-none" />
                {/* Sparkle animation */}
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-spin-slow" />
              </div>
            </Link>

            {/* Brand Text */}
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
            <p className="text-lg text-muted-foreground font-medium animate-fade-up animate-delay-200">
              Create your account
            </p>
          </div>
        </div>

        {/* Signup Card */}
        <Card className="border-amber-200/30 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-up animate-delay-300">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-2xl bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Sign Up
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Join our exclusive community of jewelry lovers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <User className="h-4.5 w-4.5 text-muted-foreground group-focus-within:text-amber-500 transition-colors duration-300" />
                  </div>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    className="pl-10 pr-4 h-11 transition-all duration-300 border-muted-foreground/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
                    {...form.register("name")}
                    data-testid="input-name"
                  />
                </div>
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-2 animate-fade-up">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <Mail className="h-4.5 w-4.5 text-muted-foreground group-focus-within:text-amber-500 transition-colors duration-300" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 pr-4 h-11 transition-all duration-300 border-muted-foreground/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
                    {...form.register("email")}
                    data-testid="input-email"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive mt-2 animate-fade-up">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <Phone className="h-4.5 w-4.5 text-muted-foreground group-focus-within:text-amber-500 transition-colors duration-300" />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0712345678"
                    className="pl-10 pr-4 h-11 transition-all duration-300 border-muted-foreground/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
                    {...form.register("phone")}
                    data-testid="input-phone"
                  />
                </div>
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive mt-2 animate-fade-up">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <Lock className="h-4.5 w-4.5 text-muted-foreground group-focus-within:text-amber-500 transition-colors duration-300" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password"
                    className="pl-10 pr-10 h-11 transition-all duration-300 border-muted-foreground/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
                    {...form.register("password")}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-amber-600 transition-colors duration-300 p-1 rounded-full hover:bg-amber-50"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive mt-2 animate-fade-up">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* OTP Preference */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Receive verification code via</Label>
                <RadioGroup
                  value={otpPreference}
                  onValueChange={(value) => form.setValue("otpPreference", value as "email" | "sms")}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2 group">
                    <RadioGroupItem 
                      value="email" 
                      id="otp-email" 
                      data-testid="radio-otp-email"
                      className="border-muted-foreground/40 text-amber-600 hover:border-amber-400"
                    />
                    <Label 
                      htmlFor="otp-email" 
                      className="font-normal cursor-pointer text-muted-foreground group-has-[:checked]:text-amber-700 transition-colors duration-300"
                    >
                      Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 group">
                    <RadioGroupItem 
                      value="sms" 
                      id="otp-sms" 
                      data-testid="radio-otp-sms"
                      className="border-muted-foreground/40 text-amber-600 hover:border-amber-400"
                    />
                    <Label 
                      htmlFor="otp-sms" 
                      className="font-normal cursor-pointer text-muted-foreground group-has-[:checked]:text-amber-700 transition-colors duration-300"
                    >
                      SMS
                    </Label>
                  </div>
                </RadioGroup>
                {otpPreference === "sms" && !form.watch("phone") && (
                  <p className="text-sm text-amber-600 mt-2 animate-fade-up flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    Please enter a phone number to receive SMS verification
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/20 disabled:opacity-50"
                disabled={signupMutation.isPending}
                data-testid="button-signup"
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-8 pt-6 border-t border-muted-foreground/10 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-amber-600 hover:text-amber-700 font-medium hover:underline transition-colors duration-300"
                  data-testid="link-login"
                >
                  Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="text-center animate-fade-up animate-delay-500">
          <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            All information is encrypted and securely stored
          </p>
        </div>
      </div>

      {/* Add custom animation keyframes */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 10s ease infinite;
        }
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-up {
          animation: fade-up 0.6s ease-out forwards;
        }
        .animate-delay-200 {
          animation-delay: 200ms;
        }
        .animate-delay-300 {
          animation-delay: 300ms;
        }
        .animate-delay-500 {
          animation-delay: 500ms;
        }
        .animate-once {
          animation-iteration-count: 1;
        }
        .animate-duration-500 {
          animation-duration: 500ms;
        }
        .animate-ease-out {
          animation-timing-function: ease-out;
        }
      `}</style>
    </div>
  );
}