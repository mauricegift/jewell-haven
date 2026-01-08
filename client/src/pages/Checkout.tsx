import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  CreditCard,
  Truck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Phone,
  ShoppingBag,
  XCircle,
  Clock,
  Sparkles,
  Gem,
  Shield,
  Zap,
  Lock,
  Gift,
  CreditCardIcon,
  Check,
  X,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, downloadInvoice } from "@/lib/queryClient";

const checkoutSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(10, "Please provide a detailed delivery address"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["mpesa", "cod"]),
  mpesaPhone: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

type PaymentStatus = "idle" | "initiating" | "pending" | "polling" | "success" | "failed";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, subtotal, totalDeliveryFee, total, clearCart } = useCart();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [pollingCount, setPollingCount] = useState(0);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [lastPollingResult, setLastPollingResult] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [animateCartItems, setAnimateCartItems] = useState<number[]>([]);
  const [showPollingScreen, setShowPollingScreen] = useState(false);
  const [isCheckingStock, setIsCheckingStock] = useState(false);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      address: "",
      notes: "",
      paymentMethod: "mpesa",
      mpesaPhone: user?.phone || "",
    },
  });

  const paymentMethod = form.watch("paymentMethod");

  // Handle authentication
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        setLocation("/login?redirect=/checkout");
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [user, isAuthLoading, setLocation]);

  // Reset form when user data loads
  useEffect(() => {
    if (user && !isAuthLoading) {
      form.reset({
        name: user.name || "",
        phone: user.phone || "",
        address: "",
        notes: "",
        paymentMethod: "mpesa",
        mpesaPhone: user.phone || "",
      });
    }
  }, [user, isAuthLoading, form]);

  // Animate cart items
  useEffect(() => {
    const timers = items.map((_, idx) => 
      setTimeout(() => {
        setAnimateCartItems(prev => [...prev, idx]);
      }, idx * 100)
    );
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [items]);

  // Check cart items
  useEffect(() => {
    if (!isCheckingAuth && items.length === 0 && paymentStatus !== "success" && paymentStatus !== "failed") {
      setLocation("/cart");
    }
  }, [items, paymentStatus, setLocation, isCheckingAuth]);

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutForm) => {
      const response = await apiRequest("POST", "/api/orders", {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        deliveryName: data.name,
        deliveryPhone: data.phone,
        deliveryAddress: data.address,
        notes: data.notes,
        paymentMethod: data.paymentMethod,
        subtotal: subtotal.toString(),
        deliveryFee: totalDeliveryFee.toString(),
        total: total.toString(),
      });
      return response;
    },
  });

  const initiateMpesaMutation = useMutation({
    mutationFn: async ({ orderId, phoneNumber, amount }: { orderId: number; phoneNumber: string; amount: string }) => {
      const response = await apiRequest("POST", "/api/payments/mpesa/stkpush", {
        orderId,
        phoneNumber,
        amount,
      });
      return response;
    },
  });

  const verifyMpesaMutation = useMutation({
    mutationFn: async (checkoutRequestId: string) => {
      const response = await apiRequest("POST", "/api/payments/mpesa/callback", {
        checkoutRequestId,
      });
      return response;
    },
  });

  const checkStockAvailability = async () => {
    setIsCheckingStock(true);
    try {
      const stockCheckPromises = items.map(async (item) => {
        try {
          const product = await apiRequest("GET", `/api/products/${item.product.id}`);
          
          // CRITICAL FIX: Even if inStock is true, check quantity
          if (!product || product.inStock === false || product.stockQuantity <= 0) {
            return {
              product: item.product.name,
              available: product?.stockQuantity || 0,
              requested: item.quantity,
              error: "Product is out of stock"
            };
          }
          
          if (product.stockQuantity < item.quantity) {
            return {
              product: product.name,
              available: product.stockQuantity,
              requested: item.quantity,
              error: "Insufficient stock"
            };
          }
          
          return null;
        } catch (error) {
          return null;
        }
      });

      const stockIssues = (await Promise.all(stockCheckPromises)).filter(Boolean);
      return { hasIssues: stockIssues.length > 0, issues: stockIssues };
      
    } catch (error) {
      return { hasIssues: true, issues: [{ product: "Unknown", available: 0, requested: 0, error: "Stock check failed" }] };
    } finally {
      setIsCheckingStock(false);
    }
  };

  const pollPaymentStatus = async (checkoutId: string, orderId: number): Promise<boolean> => {
    let attempts = 0;
    const maxAttempts = 35;
    
    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setPollingCount(attempts + 1);
      
      try {
        const result = await verifyMpesaMutation.mutateAsync(checkoutId);
        setLastPollingResult(result);
        
        if (result.success === true && result.status === "completed") {
          const mpesaData = result.data;
          if (mpesaData?.ResultCode === 0) {
            setReceiptNumber(mpesaData.MpesaReceiptNumber);
            return true;
          }
        }
        
        if (result.success === false && (result.status === "failed" || result.status === "cancelled" || result.status === "failed_insufficient_funds" || result.status === "timeout")) {
          setPollingError(result.data?.ResultDesc || "Payment was cancelled or failed");
          return false;
        }
      } catch (error) {
        // Continue polling on network error
      }
      attempts++;
    }
    
    setPollingError("Payment confirmation timed out. Please check your M-Pesa messages.");
    return false;
  };

  const onSubmit = async (data: CheckoutForm) => {
    try {
      setPaymentStatus("initiating");
      setPollingError(null);
      
      const stockCheckResult = await checkStockAvailability();
      if (stockCheckResult.hasIssues) {
        setPaymentStatus("idle");
        toast({
          title: "⚠️ Out of Stock",
          description: "Some items in your cart are no longer available. Returning to cart...",
          variant: "destructive",
        });
        setLocation("/cart");
        return;
      }

      const orderResult = await createOrderMutation.mutateAsync(data);
      setOrderId(orderResult.id);
      setOrderNumber(orderResult.orderNumber);

      if (data.paymentMethod === "cod") {
        setPaymentStatus("success");
        clearCart();
        return;
      }

      const mpesaPhone = data.mpesaPhone || data.phone;
      const formattedPhone = mpesaPhone.replace(/\D/g, '').replace(/^0/, '254').replace(/^\+/, '');

      const mpesaResult = await initiateMpesaMutation.mutateAsync({
        orderId: orderResult.id,
        phoneNumber: formattedPhone,
        amount: Math.ceil(total).toString(),
      });

      if (mpesaResult.success && mpesaResult.CheckoutRequestID) {
        setCheckoutRequestId(mpesaResult.CheckoutRequestID);
        setPaymentStatus("polling");
        setShowPollingScreen(true);

        const success = await pollPaymentStatus(mpesaResult.CheckoutRequestID, orderResult.id);
        
        if (success) {
          setPaymentStatus("success");
          setShowPollingScreen(false);
          clearCart();
          toast({
            title: "✨ Payment successful!",
            description: "Your order has been confirmed. Thank you!",
          });
        } else {
          setPaymentStatus("failed");
          setShowPollingScreen(false);
        }
      } else {
        throw new Error(mpesaResult.message || "Failed to initiate M-Pesa");
      }
    } catch (error: any) {
      setPaymentStatus("failed");
      toast({
        title: "Checkout Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  // UI RENDERING LOGIC
  
  if (isAuthLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // PAYMENT FAILED VIEW (Dark theme optimized)
  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-900 shadow-xl">
          <CardContent className="pt-10 pb-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
              <XCircle className="h-10 w-10 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Payment Failed</h2>
              <p className="text-muted-foreground">
                {pollingError || "The request was cancelled or timed out."}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => setPaymentStatus("idle")} className="w-full bg-primary hover:bg-primary/90">
                Retry M-Pesa
              </Button>
              <Button variant="outline" onClick={() => {
                form.setValue("paymentMethod", "cod");
                setPaymentStatus("idle");
              }} className="w-full">
                Switch to Cash on Delivery
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // POLLING SCREEN
  if (showPollingScreen && paymentStatus === "polling") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full text-center border-blue-200 dark:border-blue-900/50 bg-white dark:bg-slate-900">
          <CardContent className="pt-12 pb-8 space-y-6">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-blue-600" />
            <h2 className="text-2xl font-bold text-foreground">Confirming Payment</h2>
            <p className="text-muted-foreground px-4">
              Please check your phone and enter your M-Pesa PIN. We are waiting for the confirmation...
            </p>
            <Badge variant="outline" className="animate-pulse">
              Attempt {pollingCount} of 35
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // SUCCESS VIEW
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-2xl w-full border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 shadow-2xl">
          <CardContent className="pt-12 pb-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-serif font-bold text-foreground">Order Confirmed!</h1>
              <p className="text-muted-foreground text-lg">Thank you for your order, {form.getValues("name")}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left bg-muted/50 p-6 rounded-xl border border-border">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Order Number</p>
                <p className="font-mono font-bold text-primary">#{orderNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Payment Method</p>
                <p className="font-medium">{paymentMethod === "mpesa" ? "M-Pesa" : "Cash on Delivery"}</p>
              </div>
              {receiptNumber && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">M-Pesa Receipt</p>
                  <p className="font-mono text-emerald-600 dark:text-emerald-400">{receiptNumber}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Status</p>
                <Badge className="bg-emerald-500">Processing</Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button onClick={() => downloadInvoice(orderNumber!, "customer")} className="flex-1 gap-2" disabled={downloading}>
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download Invoice
              </Button>
              <Link href="/shop" className="flex-1">
                <Button variant="outline" className="w-full">Continue Shopping</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // MAIN CHECKOUT FORM
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
       <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/cart")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-serif font-bold">Checkout</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input {...form.register("name")} placeholder="Gifted Maurice" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input {...form.register("phone")} placeholder="07XXXXXXXX" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Delivery Address</Label>
                  <Textarea {...form.register("address")} placeholder="E.g. Rupas Mall, 2nd Floor, Eldoret" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  defaultValue="mpesa" 
                  onValueChange={(v) => form.setValue("paymentMethod", v as "mpesa" | "cod")}
                  className="grid md:grid-cols-2 gap-4"
                >
                  <Label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'mpesa' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted'}`}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="mpesa" />
                      <div>
                        <p className="font-bold">M-Pesa</p>
                        <p className="text-xs text-muted-foreground">Lipa na M-Pesa</p>
                      </div>
                    </div>
                    <img src="/mpesa-logo.png" className="h-6 object-contain" alt="Mpesa" />
                  </Label>

                  <Label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted'}`}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="cod" />
                      <div>
                        <p className="font-bold">Cash on Delivery</p>
                        <p className="text-xs text-muted-foreground">Pay when you receive</p>
                      </div>
                    </div>
                    <Truck className="h-6 w-6 text-muted-foreground" />
                  </Label>
                </RadioGroup>

                {paymentMethod === "mpesa" && (
                  <div className="mt-6 p-4 bg-muted rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                    <Label>M-Pesa Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input {...form.register("mpesaPhone")} className="pl-10" placeholder="07XXXXXXXX" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      An STK push will be sent to this number.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 overflow-hidden border-2 border-primary/10">
            <CardHeader className="bg-muted/30">
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product.name} <span className="text-xs">x{item.quantity}</span>
                    </span>
                    <span className="font-medium">KES {(parseFloat(item.product.price) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>KES {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>KES {totalDeliveryFee.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold text-primary">
                  <span>Total</span>
                  <span>KES {total.toLocaleString()}</span>
                </div>
              </div>

              <Button 
                form="checkout-form"
                type="submit" 
                className="w-full h-12 text-lg font-bold gap-2 shadow-lg shadow-primary/20"
                disabled={paymentStatus !== "idle" || form.formState.isSubmitting}
              >
                {paymentStatus !== "idle" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    Place Secure Order
                  </>
                )}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" /> Secure SSL Encrypted Payment
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}