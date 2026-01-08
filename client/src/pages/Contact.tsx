import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  MessageSquare,
  Calendar,
  User,
  Clock as ClockIcon,
  ChevronDown,
  ChevronUp,
  Lock,
  Sparkles,
  ArrowRight,
  Globe,
  Store,
  MailCheck,
  PhoneCall,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type ContactForm = z.infer<typeof contactSchema>;

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
  updatedAt: string;
  replies: ContactReply[];
}

interface ContactReply {
  id: number;
  contactId: number;
  adminId: number;
  adminName: string;
  message: string;
  createdAt: string;
}

const contactInfo = [
  {
    icon: Store,
    title: "Visit Our Store",
    details: ["Rupas Mall", "Eldoret, Kenya"],
    link: "https://maps.google.com",
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600"
  },
  {
    icon: PhoneCall,
    title: "Call Us",
    details: ["+254 799 916 673", "+254 792 824 701"],
    link: "tel:+254799916673",
    color: "bg-green-500",
    hoverColor: "hover:bg-green-600"
  },
  {
    icon: MailCheck,
    title: "Email Us",
    details: ["jewell@giftedtech.co.ke", "jewel-haven@giftedtech.co.ke"],
    link: "mailto:jewell@giftedtech.co.ke",
    color: "bg-purple-500",
    hoverColor: "hover:bg-purple-600"
  },
  {
    icon: Clock,
    title: "Opening Hours",
    details: ["Mon - Fri: 9:00 AM - 6:00 PM", "Sat: 10:00 AM - 4:00 PM", "Sun: Closed"],
    color: "bg-amber-500",
    hoverColor: "hover:bg-amber-600"
  }
];

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  read: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  replied: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export default function Contact() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState("send");
  const [openMessages, setOpenMessages] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: ""
    }
  });

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (user) {
      form.setValue("email", user.email);
      form.setValue("name", user.name || "");
      form.setValue("phone", user.phone || "");
    }
  }, [user, form]);

  // Fetch user's contact messages
  const { 
    data: contactHistory, 
    isLoading: historyLoading, 
    refetch: refetchHistory,
    error: historyError 
  } = useQuery({
    queryKey: ["userContacts"],
    queryFn: async () => {
      try {
        const response = await apiRequest<ContactMessage[]>("GET", "/api/user/contacts");
        return response;
      } catch (error: any) {
        throw error;
      }
    },
    retry: 1,
    enabled: !!user, // Only fetch if user is logged in
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      return await apiRequest<{ message: string; success: boolean; data: any }>("POST", "/api/contact", data);
    },
    onSuccess: (data) => {
      setIsSubmitted(true);
      form.reset();
      
      // Reset form with user data if logged in
      if (user) {
        form.setValue("email", user.email);
        form.setValue("name", user.name || "");
        form.setValue("phone", user.phone || "");
      }
      
      // Refetch history if user is logged in
      if (user) {
        refetchHistory();
      }
      
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });
    },
    onError: (error: any) => {
      console.error("Contact mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ContactForm) => {
    contactMutation.mutate(data);
  };

  const toggleMessage = (messageId: number) => {
    setOpenMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTabChange = (value: string) => {
    if (value === activeTab || isAnimating) return;
    
    // Show toast if trying to access history without being logged in
    if (value === "history" && !user) {
      toast({
        title: "Login Required",
        description: "Please login to view your message history.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnimating(true);
    
    // Add fade out animation
    setTimeout(() => {
      setActiveTab(value);
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 200);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 md:px-6">
        {/* Hero Section with Animation */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 animate-in fade-in-0 duration-500">
            Get in <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto animate-in fade-in-0 duration-500 delay-100">
            Have questions about our jewelry or services? We're here to help. 
            Reach out to us through any of the channels below.
          </p>
          
          {/* Animated floating elements */}
          <div className="relative mt-8 h-2">
            <div className="absolute left-1/4 top-0 w-1 h-1 bg-primary rounded-full animate-ping" />
            <div className="absolute left-1/2 top-0 w-1 h-1 bg-primary/50 rounded-full animate-ping delay-300" />
            <div className="absolute left-3/4 top-0 w-1 h-1 bg-primary/30 rounded-full animate-ping delay-700" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Contact Information with Animations */}
          <div className="lg:col-span-1 space-y-6">
            {contactInfo.map((info, idx) => {
              const Icon = info.icon;
              return (
                <Card 
                  key={idx} 
                  className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group animate-in fade-in-0"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4 items-start">
                      <div className={cn(
                        "p-3 rounded-xl text-white transition-all duration-300 group-hover:scale-110",
                        info.color,
                        info.hoverColor
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{info.title}</h3>
                          {info.link && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                          )}
                        </div>
                        {info.details.map((detail, i) => (
                          <p key={i} className="text-sm text-muted-foreground mb-1 last:mb-0">
                            {detail}
                          </p>
                        ))}
                        {info.link && (
                          <a
                            href={info.link}
                            className="text-sm text-primary hover:underline mt-2 inline-block opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          >
                            Click to {info.title.toLowerCase()}
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 relative overflow-visible">
                {/* Animated background indicator */}
                <div className={cn(
                  "absolute h-full bg-primary/10 rounded-lg transition-all duration-300 ease-in-out",
                  activeTab === "send" && "left-0 w-1/2",
                  activeTab === "history" && "left-1/2 w-1/2"
                )} />
                
                <TabsTrigger 
                  value="send" 
                  className="relative z-10 text-sm md:text-base transition-all duration-300 hover:scale-105 gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Message
                  {activeTab === "send" && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full animate-pulse" />
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="relative z-10 text-sm md:text-base transition-all duration-300 hover:scale-105 gap-2"
                  disabled={!user}
                >
                  <MessageSquare className="h-4 w-4" />
                  Message History
                  {!user && (
                    <Lock className="h-3 w-3 ml-1 text-muted-foreground" />
                  )}
                  {activeTab === "history" && user && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full animate-pulse" />
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="send">
                <div className={cn(
                  "transition-all duration-300",
                  isAnimating && activeTab === "send" ? "opacity-0" : "opacity-100"
                )}>
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-primary" />
                        Send us a Message
                      </CardTitle>
                      {user && (
                        <p className="text-sm text-muted-foreground mt-1">
                          You are logged in as {user.email}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      {isSubmitted ? (
                        <div className="text-center py-12 animate-in zoom-in-95 duration-500">
                          <div className="p-4 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 inline-block mb-6">
                            <CheckCircle className="h-16 w-16 text-green-600 animate-bounce" />
                          </div>
                          <h3 className="text-2xl font-bold mb-3 animate-in slide-in-from-top-10 duration-500">
                            Thank You! <Sparkles className="inline h-5 w-5 text-amber-500 ml-1" />
                          </h3>
                          <p className="text-muted-foreground mb-6 animate-in fade-in-0 duration-500 delay-300">
                            Your message has been received. We'll get back to you within 24 hours.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-in fade-in-0 duration-500 delay-500">
                            <Button 
                              onClick={() => setIsSubmitted(false)} 
                              className="hover:scale-105 transition-transform duration-200"
                            >
                              Send Another Message
                            </Button>
                            {user && (
                              <Button 
                                variant="outline" 
                                onClick={() => handleTabChange("history")}
                                className="hover:scale-105 transition-transform duration-200"
                              >
                                View Message History
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 animate-in slide-in-from-left-10 duration-500">
                              <Label htmlFor="name" className="text-sm md:text-base">Full Name *</Label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="name"
                                  {...form.register("name")}
                                  placeholder="John Doe"
                                  className="pl-10 focus:border-primary transition-all duration-200"
                                  disabled={!!user}
                                />
                              </div>
                              {form.formState.errors.name && (
                                <p className="text-xs md:text-sm text-destructive animate-in fade-in-0">
                                  {form.formState.errors.name.message}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2 animate-in slide-in-from-right-10 duration-500">
                              <Label htmlFor="email" className="text-sm md:text-base">Email Address *</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="email"
                                  type="email"
                                  {...form.register("email")}
                                  placeholder="john@example.com"
                                  className="pl-10 focus:border-primary transition-all duration-200"
                                  disabled={!!user}
                                />
                              </div>
                              {form.formState.errors.email && (
                                <p className="text-xs md:text-sm text-destructive animate-in fade-in-0">
                                  {form.formState.errors.email.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 animate-in slide-in-from-left-10 duration-500 delay-100">
                            <Label htmlFor="phone" className="text-sm md:text-base">Phone Number *</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="phone"
                                {...form.register("phone")}
                                placeholder="0712345678"
                                className="pl-10 focus:border-primary transition-all duration-200"
                                disabled={!!user}
                              />
                            </div>
                            {form.formState.errors.phone && (
                              <p className="text-xs md:text-sm text-destructive animate-in fade-in-0">
                                {form.formState.errors.phone.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2 animate-in slide-in-from-right-10 duration-500 delay-200">
                            <Label htmlFor="subject" className="text-sm md:text-base">Subject *</Label>
                            <div className="relative">
                              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="subject"
                                {...form.register("subject")}
                                placeholder="How can we help you?"
                                className="pl-10 focus:border-primary transition-all duration-200"
                              />
                            </div>
                            {form.formState.errors.subject && (
                              <p className="text-xs md:text-sm text-destructive animate-in fade-in-0">
                                {form.formState.errors.subject.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2 animate-in slide-in-from-left-10 duration-500 delay-300">
                            <Label htmlFor="message" className="text-sm md:text-base">Message *</Label>
                            <div className="relative">
                              <Textarea
                                id="message"
                                {...form.register("message")}
                                placeholder="Tell us about your inquiry..."
                                rows={5}
                                className="pl-10 focus:border-primary transition-all duration-200 min-h-[120px] resize-y"
                              />
                              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            </div>
                            {form.formState.errors.message && (
                              <p className="text-xs md:text-sm text-destructive animate-in fade-in-0">
                                {form.formState.errors.message.message}
                              </p>
                            )}
                          </div>

                          <Button 
                            type="submit" 
                            className="w-full gap-3 h-12 text-base group animate-in fade-in-0 duration-500 delay-500"
                            disabled={contactMutation.isPending}
                          >
                            {contactMutation.isPending ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                                Send Message
                              </>
                            )}
                          </Button>

                          <p className="text-xs text-muted-foreground text-center animate-in fade-in-0 duration-500 delay-700">
                            <Lock className="inline h-3 w-3 mr-1" />
                            By submitting this form, you agree to our privacy policy. 
                            We'll never share your information with third parties.
                          </p>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="history">
                <div className={cn(
                  "transition-all duration-300",
                  isAnimating && activeTab === "history" ? "opacity-0" : "opacity-100"
                )}>
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-primary" />
                          Your Message History
                        </span>
                        {user && (
                          <span className="text-sm font-normal text-muted-foreground truncate ml-2">
                            ({user.email})
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!user ? (
                        <div className="text-center py-12">
                          <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-xl font-bold mb-2">Login Required</h3>
                          <p className="text-muted-foreground mb-6">
                            Please login to view your message history.
                          </p>
                          <Button 
                            onClick={() => {
                              window.location.href = `/login?redirect=${encodeURIComponent("/contact")}`;
                            }}
                            className="hover:scale-105 transition-transform duration-200"
                          >
                            Go to Login
                          </Button>
                        </div>
                      ) : historyLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                              <Skeleton className="h-6 w-1/3" />
                              <Skeleton className="h-32 w-full" />
                            </div>
                          ))}
                        </div>
                      ) : historyError ? (
                        <div className="text-center py-12">
                          <MessageSquare className="h-16 w-16 mx-auto text-destructive mb-4" />
                          <h3 className="text-xl font-bold mb-2">Error Loading Messages</h3>
                          <p className="text-muted-foreground mb-6">
                            Failed to load your message history. Please try again.
                          </p>
                          <Button 
                            onClick={() => refetchHistory()}
                            className="hover:scale-105 transition-transform duration-200"
                          >
                            Retry
                          </Button>
                        </div>
                      ) : contactHistory && contactHistory.length > 0 ? (
                        <div className="space-y-4">
                          {contactHistory.map((message, idx) => (
                            <Collapsible
                              key={message.id}
                              open={openMessages.includes(message.id)}
                              onOpenChange={() => toggleMessage(message.id)}
                              className="border rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 group"
                            >
                              <div className="p-4">
                                <CollapsibleTrigger asChild>
                                  <div className="flex justify-between items-center cursor-pointer">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                        <h4 className="font-medium truncate text-sm md:text-base group-hover:text-primary transition-colors duration-200">
                                          {message.subject}
                                        </h4>
                                        <Badge className={cn(
                                          `${statusColors[message.status]} whitespace-nowrap text-xs`,
                                          "group-hover:scale-105 transition-transform duration-200"
                                        )}>
                                          {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                                          {message.replies?.length > 0 && ` (${message.replies.length} reply)`}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                        <Calendar className="h-3 w-3 flex-shrink-0" />
                                        <span>{formatDate(message.createdAt)}</span>
                                        <span className="hidden sm:inline"> </span>
                                        <span className="truncate">{message.email}</span>
                                      </div>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="ml-2 h-8 w-8 p-0 hover:scale-110 transition-transform duration-200"
                                    >
                                      {openMessages.includes(message.id) ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 group-hover:animate-bounce" />
                                      )}
                                    </Button>
                                  </div>
                                </CollapsibleTrigger>
                                
                                <CollapsibleContent className="mt-4 animate-in slide-in-from-top-5 fade-in-0 duration-300">
                                  <div className="space-y-4 pt-4 border-t">
                                    {/* Original Message */}
                                    <div className="bg-muted/50 p-4 rounded-lg border hover:border-primary/50 transition-all duration-300">
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1.5 rounded-full bg-primary/10">
                                            <User className="h-4 w-4 text-primary" />
                                          </div>
                                          <span className="font-medium">{message.name}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDate(message.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                                        {message.message}
                                      </p>
                                    </div>

                                    {/* Admin Replies */}
                                    {message.replies && message.replies.length > 0 && (
                                      <div className="space-y-3">
                                        <h5 className="font-medium text-sm md:text-base flex items-center gap-2">
                                          <Sparkles className="h-4 w-4 text-amber-500" />
                                          Admin Replies:
                                        </h5>
                                        {message.replies.map((reply, replyIdx) => (
                                          <div 
                                            key={reply.id} 
                                            className="bg-primary/5 border border-primary/10 p-4 rounded-lg hover:shadow-sm transition-all duration-300 animate-in fade-in-0"
                                            style={{ animationDelay: `${replyIdx * 100}ms` }}
                                          >
                                            <div className="flex justify-between items-start mb-2">
                                              <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-full bg-primary/20">
                                                  <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="font-medium">
                                                  {reply.adminName}
                                                  <span className="text-xs text-primary ml-2">
                                                    (Admin)
                                                  </span>
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <ClockIcon className="h-3 w-3" />
                                                {formatDate(reply.createdAt)}
                                              </div>
                                            </div>
                                            <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                                              {reply.message}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 animate-in zoom-in-95 duration-500">
                          <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-bounce" />
                          <h3 className="text-xl font-bold mb-2">No message history found</h3>
                          <p className="text-muted-foreground mb-6">
                            You haven't sent any messages yet.
                          </p>
                          <Button 
                            onClick={() => handleTabChange("send")}
                            className="hover:scale-105 transition-transform duration-200"
                          >
                            Send Your First Message
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}