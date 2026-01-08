import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Lock, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const resetSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "reset" | "success">("email");
  const [email, setEmail] = useState("");

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  const requestResetMutation = useMutation({
    mutationFn: async (data: EmailForm) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response;
    },
    onSuccess: () => {
      setEmail(emailForm.getValues("email"));
      setStep("reset");
      toast({
        title: "Code sent!",
        description: "Check your email for the reset code.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not send reset code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetForm) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        email,
        code: data.code,
        newPassword: data.newPassword,
      });
      return response;
    },
    onSuccess: () => {
      setStep("success");
      toast({
        title: "Password reset!",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not reset password. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (step === "success") {
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
          </div>

          <Card className="border-amber-200/30 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-up animate-delay-300">
            <CardContent className="pt-8 pb-6 space-y-6 text-center">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900 inline-block animate-scale-in">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h1 className="font-serif text-2xl font-bold text-foreground">
                  Password Reset!
                </h1>
                <p className="text-muted-foreground">
                  Your password has been updated successfully.
                </p>
              </div>
              <Link href="/login">
                <Button 
                  className="w-full h-11 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/20"
                  data-testid="button-go-login"
                >
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              Reset your password
            </p>
          </div>
        </div>

        <Card className="border-amber-200/30 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-up animate-delay-300">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-2xl bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              {step === "email" ? "Forgot Password" : "Reset Password"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === "email"
                ? "Enter your email to receive a reset code"
                : `Enter the code sent to ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form
                onSubmit={emailForm.handleSubmit((data) => requestResetMutation.mutate(data))}
                className="space-y-6"
              >
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
                      {...emailForm.register("email")}
                      data-testid="input-email"
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-sm text-destructive mt-2 animate-fade-up">
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/20 disabled:opacity-50"
                  disabled={requestResetMutation.isPending}
                  data-testid="button-send-code"
                >
                  {requestResetMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Code"
                  )}
                </Button>
              </form>
            ) : (
              <form
                onSubmit={resetForm.handleSubmit((data) => resetPasswordMutation.mutate(data))}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Verification Code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={resetForm.watch("code")}
                      onChange={(value) => resetForm.setValue("code", value)}
                      data-testid="input-reset-otp"
                    >
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <InputOTPSlot 
                            key={index} 
                            index={index} 
                            className="h-12 w-12 border-amber-200 hover:border-amber-400 transition-colors duration-300"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {resetForm.formState.errors.code && (
                    <p className="text-sm text-destructive text-center mt-2 animate-fade-up">
                      {resetForm.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <Lock className="h-4.5 w-4.5 text-muted-foreground group-focus-within:text-amber-500 transition-colors duration-300" />
                    </div>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      className="pl-10 pr-4 h-11 transition-all duration-300 border-muted-foreground/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
                      {...resetForm.register("newPassword")}
                      data-testid="input-new-password"
                    />
                  </div>
                  {resetForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive mt-2 animate-fade-up">
                      {resetForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <Lock className="h-4.5 w-4.5 text-muted-foreground group-focus-within:text-amber-500 transition-colors duration-300" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      className="pl-10 pr-4 h-11 transition-all duration-300 border-muted-foreground/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
                      {...resetForm.register("confirmPassword")}
                      data-testid="input-confirm-password"
                    />
                  </div>
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-2 animate-fade-up">
                      {resetForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/20 disabled:opacity-50"
                  disabled={resetPasswordMutation.isPending}
                  data-testid="button-reset-password"
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-10 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors duration-300"
                  onClick={() => setStep("email")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Use different email
                </Button>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-muted-foreground/10 text-center">
              <Link
                href="/login"
                className="text-amber-600 hover:text-amber-700 font-medium hover:underline transition-colors duration-300"
                data-testid="link-back-login"
              >
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
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
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
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