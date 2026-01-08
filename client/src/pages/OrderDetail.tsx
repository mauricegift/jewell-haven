import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Truck,
  CreditCard,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Sparkles,
  Shield,
  Home,
  Phone,
  Mail,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, downloadInvoice } from "@/lib/queryClient";
import type { Order, OrderItem } from "@shared/schema";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

const statusConfig: Record<string, { 
  color: string; 
  icon: React.ReactNode; 
  label: string; 
  gradient: string;
}> = {
  pending: {
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    icon: <Clock className="h-4 w-4" />,
    label: "Pending",
    gradient: "from-yellow-500 to-amber-500"
  },
  processing: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    icon: <Package className="h-4 w-4" />,
    label: "Processing",
    gradient: "from-blue-500 to-cyan-500"
  },
  paid: {
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Paid",
    gradient: "from-emerald-500 to-green-500"
  },
  delivered: {
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    icon: <Truck className="h-4 w-4" />,
    label: "Delivered",
    gradient: "from-purple-500 to-pink-500"
  },
  completed: {
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Completed",
    gradient: "from-emerald-600 to-green-600"
  },
};

const paymentStatusConfig: Record<string, { color: string; label: string; gradient: string }> = {
  pending: {
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    label: "Pending",
    gradient: "from-yellow-500 to-amber-500"
  },
  paid: {
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    label: "Paid",
    gradient: "from-emerald-500 to-green-500"
  },
};

export default function OrderDetail() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const orderNumber = location.split("/").pop();
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: order, isLoading, error } = useQuery<OrderWithItems>({
    queryKey: [`/api/orders/${orderNumber}`],
    enabled: !!orderNumber,
  });

  const handleDownloadInvoice = async () => {
    if (!orderNumber) return;
    
    try {
      setDownloading(true);
      await downloadInvoice(orderNumber, "customer");
      
      toast({
        title: "📄 Invoice downloaded",
        description: "Customer invoice has been downloaded successfully.",
        className: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50",
      });
    } catch (error: any) {
      console.error("Download invoice error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const copyOrderNumber = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    toast({
      title: "📋 Copied!",
      description: "Order number copied to clipboard",
      className: "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load order details.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 bg-gradient-to-b from-amber-50/10 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="space-y-6 animate-pulse">
            <Skeleton className="h-6 w-48 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20" />
            <Card className="border-amber-200">
              <CardHeader>
                <Skeleton className="h-8 w-64 bg-gradient-to-r from-amber-200 to-yellow-200 dark:from-amber-800/30 dark:to-yellow-800/30" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center bg-gradient-to-b from-amber-50/10 to-white dark:from-gray-900 dark:to-gray-950">
        <Card className="max-w-md w-full border-amber-200 bg-gradient-to-br from-amber-50/50 to-yellow-50/30">
          <CardContent className="pt-12 pb-10 text-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20 inline-block mb-6">
              <AlertCircle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-8">
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/account">
              <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 transition-all duration-300">
                View My Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const paymentStatus = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.pending;

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-amber-50/10 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="mb-8">
          <Link 
            href="/account" 
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-800 hover:gap-3 transition-all duration-300 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Orders
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                Order Details
              </h1>
              <button
                onClick={copyOrderNumber}
                className="p-2 rounded-lg hover:bg-amber-50 transition-colors duration-200"
                title="Copy order number"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Copy className="h-5 w-5 text-amber-400" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`
                px-4 py-1.5 text-sm font-medium bg-gradient-to-r ${status.gradient} text-white
                shadow-lg
              `}>
                {status.icon}
                <span className="ml-2">{status.label}</span>
              </Badge>
              <Badge className={`
                px-4 py-1.5 text-sm font-medium bg-gradient-to-r ${paymentStatus.gradient} text-white
                shadow-lg
              `}>
                {paymentStatus.label}
              </Badge>
              <span className="font-mono text-lg font-bold text-primary bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                #{order.orderNumber}
              </span>
            </div>
          </div>
          
          <Button 
            onClick={handleDownloadInvoice} 
            disabled={downloading}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 hover:shadow-xl hover:shadow-amber-200/50 transition-all duration-300 gap-2 animate-pop-in"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card className="border-2 border-amber-200/50 dark:border-amber-800/30 overflow-hidden animate-fade-up">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/20 to-transparent dark:from-amber-900/5"></div>
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Package className="h-6 w-6" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div 
                      key={item.id} 
                      className="
                        flex items-center gap-4 p-4 rounded-xl 
                        bg-gradient-to-r from-amber-50/30 to-yellow-50/20 
                        dark:from-amber-900/10 dark:to-yellow-900/10
                        border border-amber-200/50 dark:border-amber-800/30
                        hover:scale-102 hover:shadow-md transition-all duration-300
                        animate-fade-up
                      "
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="relative">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-20 h-20 object-cover rounded-lg shadow-lg"
                        />
                        <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
                          {item.quantity}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          KSh {parseFloat(item.price).toLocaleString()} each
                        </p>
                      </div>
                      <p className="font-bold text-lg bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                        KSh {(parseFloat(item.price) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card className="border-2 border-blue-200/50 dark:border-blue-800/30 overflow-hidden animate-fade-up" style={{ animationDelay: '100ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-cyan-50/20 dark:from-blue-900/5 dark:to-cyan-900/5"></div>
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Truck className="h-6 w-6" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{order.deliveryName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
                        <Phone className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{order.deliveryPhone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{order.deliveryAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500">
                        <Home className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Method</p>
                        <p className="font-medium uppercase">{order.paymentMethod}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {order.notes && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50/50 to-yellow-50/30 border border-amber-200/50">
                    <p className="text-sm text-muted-foreground mb-2">Order Notes:</p>
                    <p className="font-medium">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="border-2 border-amber-200/50 dark:border-amber-800/30 overflow-hidden animate-fade-up" style={{ animationDelay: '200ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 to-yellow-50/20 dark:from-amber-900/10 dark:to-yellow-900/10"></div>
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <CreditCard className="h-6 w-6" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Order Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>Payment Method: {order.paymentMethod.toUpperCase()}</span>
                  </div>
                  {order.mpesaReceiptNumber && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">M-Pesa Receipt: </span>
                      <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        {order.mpesaReceiptNumber}
                      </span>
                    </div>
                  )}
                </div>

                <Separator className="border-amber-200" />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">KSh {parseFloat(order.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-medium">KSh {parseFloat(order.deliveryFee).toLocaleString()}</span>
                  </div>
                  <Separator className="border-amber-200" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span className="text-xl bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                      KSh {parseFloat(order.total).toLocaleString()}
                    </span>
                  </div>
                </div>

                {order.status === 'processing' && (
                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50/50 to-cyan-50/30 border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-blue-700">Your order is being prepared</span>
                    </div>
                    <p className="text-xs text-blue-600">
                      We'll notify you when it's ready for delivery
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="border-2 border-emerald-200/50 dark:border-emerald-800/30 overflow-hidden animate-fade-up" style={{ animationDelay: '300ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 to-green-50/20 dark:from-emerald-900/5 dark:to-green-900/5"></div>
              <CardContent className="pt-8 pb-6 text-center relative">
                <div className="p-4 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 inline-block mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-medium mb-4 text-emerald-700 dark:text-emerald-400">
                  Need Help?
                </h4>
                <p className="text-sm text-muted-foreground mb-6">
                  If you have any questions about your order, please contact our customer support.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">+254 799 916 673</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">support@jewellhaven.giftedtech.co.ke</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Track Order */}
            <Card className="border-2 border-purple-200/50 dark:border-purple-800/30 overflow-hidden animate-fade-up" style={{ animationDelay: '400ms' }}>
              <CardContent className="pt-8 pb-6 text-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 inline-block mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-medium mb-4 text-purple-700 dark:text-purple-400">
                  Track Your Order
                </h4>
                <p className="text-sm text-muted-foreground mb-6">
                  Get real-time updates on your order delivery status.
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 gap-2"
                  asChild
                >
                  <Link href={`/tracking/${order.orderNumber}`}>
                    <ExternalLink className="h-4 w-4" />
                    Track Order
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}