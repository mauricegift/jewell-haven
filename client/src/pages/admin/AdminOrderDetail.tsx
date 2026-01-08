import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  User,
  Phone,
  MapPin,
  Mail,
  Edit,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, downloadInvoice } from "@/lib/queryClient";
import { AdminLayout } from "./AdminLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productImage: string;
  price: string;
  quantity: number;
}

interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  deliveryAddress: string;
  deliveryPhone: string;
  deliveryName: string;
  notes?: string;
  mpesaReceiptNumber?: string;
  mpesaCheckoutId?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderWithItems extends Order {
  items: OrderItem[];
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: {
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    icon: <Clock className="h-4 w-4" />,
    label: "Pending",
  },
  processing: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    icon: <Package className="h-4 w-4" />,
    label: "Processing",
  },
  paid: {
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Paid",
  },
  delivered: {
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    icon: <Truck className="h-4 w-4" />,
    label: "Delivered",
  },
  completed: {
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Completed",
  },
  cancelled: {
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    icon: <AlertCircle className="h-4 w-4" />,
    label: "Cancelled",
  },
};

const paymentStatusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: {
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    icon: <Clock className="h-4 w-4" />,
    label: "Pending",
  },
  paid: {
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Paid",
  },
  failed: {
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    icon: <AlertCircle className="h-4 w-4" />,
    label: "Failed",
  },
  refunded: {
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    icon: <ArrowLeft className="h-4 w-4" />,
    label: "Refunded",
  },
};

const statusOptions = ["pending", "processing", "paid", "delivered", "completed", "cancelled"];
const paymentStatusOptions = ["pending", "paid", "failed", "refunded"];

export default function AdminOrderDetail() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orderNumber = location.split("/").pop();
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    status: "",
    paymentStatus: "",
    deliveryName: "",
    deliveryPhone: "",
    deliveryAddress: "",
    notes: "",
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [animateCard, setAnimateCard] = useState(false);

  const { data: order, isLoading, error } = useQuery<OrderWithItems>({
    queryKey: [`/api/orders/${orderNumber}`],
    enabled: !!orderNumber,
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/admin/orders/${order?.id}/status`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderNumber}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order updated",
        description: "Order details have been updated successfully.",
      });
      setEditing(false);
      setEditDialogOpen(false);
      // Trigger animation on update
      setAnimateCard(true);
      setTimeout(() => setAnimateCard(false), 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    },
  });

  const downloadInvoiceHandler = async (type: "admin" | "customer" = "admin") => {
    if (!orderNumber) return;
    
    try {
      setDownloading(true);
      await downloadInvoice(orderNumber, type);
      
      toast({
        title: "Invoice downloaded",
        description: `${type === 'admin' ? 'Admin' : 'Customer'} invoice has been downloaded.`,
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

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load order details.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (order) {
      setEditForm({
        status: order.status,
        paymentStatus: order.paymentStatus,
        deliveryName: order.deliveryName,
        deliveryPhone: order.deliveryPhone,
        deliveryAddress: order.deliveryAddress,
        notes: order.notes || "",
      });
      // Trigger entrance animation
      setTimeout(() => setAnimateCard(true), 100);
      setTimeout(() => setAnimateCard(false), 1100);
    }
  }, [order]);

  const handleEditSubmit = () => {
    if (!order) return;
    
    const updateData: any = {};
    if (editForm.status !== order.status) {
      updateData.status = editForm.status;
    }
    if (editForm.paymentStatus !== order.paymentStatus) {
      updateData.paymentStatus = editForm.paymentStatus;
    }
    
    // Only update delivery info if changed
    if (editForm.deliveryName !== order.deliveryName ||
        editForm.deliveryPhone !== order.deliveryPhone ||
        editForm.deliveryAddress !== order.deliveryAddress ||
        editForm.notes !== (order.notes || "")) {
      updateData.deliveryInfo = {
        name: editForm.deliveryName,
        phone: editForm.deliveryPhone,
        address: editForm.deliveryAddress,
        notes: editForm.notes,
      };
    }
    
    if (Object.keys(updateData).length > 0) {
      updateOrderMutation.mutate(updateData);
    } else {
      setEditing(false);
      setEditDialogOpen(false);
    }
  };

  const status = statusConfig[order?.status || "pending"];
  const paymentStatus = paymentStatusConfig[order?.paymentStatus || "pending"];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen py-4 md:py-8">
          <div className="container mx-auto px-3 md:px-6 max-w-7xl">
            <div className="space-y-6">
              <Skeleton className="h-8 w-48 animate-pulse" />
              <Card className="animate-pulse">
                <CardHeader>
                  <Skeleton className="h-8 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="min-h-screen py-8 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4 animate-in slide-in-from-bottom-8 duration-500">
            <CardContent className="pt-8 pb-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4 animate-bounce" />
              <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The order you're looking for doesn't exist.
              </p>
              <Link href="/admin/orders">
                <Button className="animate-in fade-in duration-700">View All Orders</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen py-4 md:py-8">
        <div className="container mx-auto px-3 md:px-6 max-w-7xl">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/admin/orders">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1 px-2 hover:scale-105 transition-transform duration-200"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden xs:inline">Back to Orders</span>
                  </Button>
                </Link>
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                  Order #{order.orderNumber}
                </h1>
              </div>
              <p className="text-sm md:text-base text-muted-foreground">
                Created on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex flex-col xs:flex-row gap-2 w-full xs:w-auto animate-in fade-in slide-in-from-right-2 duration-500 delay-150">
              <Button
                onClick={() => setEditDialogOpen(true)}
                variant="outline"
                className="gap-2 flex-1 xs:flex-none hover:scale-105 transition-transform duration-200"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Order</span>
              </Button>
              <Button
                onClick={() => downloadInvoiceHandler("admin")}
                disabled={downloading}
                className="gap-2 flex-1 xs:flex-none hover:scale-105 transition-transform duration-200"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Invoice</span>
              </Button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Left Column - Items & Delivery */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Order Items Card */}
              <Card className={`animate-in fade-in slide-in-from-left-2 duration-500 ${animateCard ? 'ring-2 ring-primary ring-offset-2 transition-all duration-300' : ''}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Package className="h-5 w-5 animate-in fade-in duration-500" />
                    Order Items ({order.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {order.items.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="flex items-start gap-3 md:gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-200 animate-in fade-in slide-in-from-left-2"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-12 h-12 md:w-16 md:h-16 object-cover rounded flex-shrink-0 hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-muted rounded flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform duration-200">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            Qty: {item.quantity} • KSh {parseFloat(item.price).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-medium text-sm md:text-base">
                            KSh {(parseFloat(item.price) * item.quantity).toLocaleString()}
                          </p>
                          <Link href={`/product/${item.productId}`}>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="h-auto p-0 text-xs hover:scale-105 transition-transform duration-200"
                            >
                              View Product
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Information Card */}
              <Card className="animate-in fade-in slide-in-from-left-2 duration-500 delay-100">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Truck className="h-5 w-5 animate-in fade-in duration-500" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="animate-in fade-in duration-500">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground animate-in fade-in duration-500" />
                        <p className="text-sm text-muted-foreground">Name</p>
                      </div>
                      <p className="font-medium text-sm md:text-base">{order.deliveryName}</p>
                    </div>
                    <div className="animate-in fade-in duration-500 delay-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-4 w-4 text-muted-foreground animate-in fade-in duration-500" />
                        <p className="text-sm text-muted-foreground">Phone</p>
                      </div>
                      <p className="font-medium text-sm md:text-base">{order.deliveryPhone}</p>
                    </div>
                  </div>
                  <div className="animate-in fade-in duration-500 delay-200">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-muted-foreground animate-in fade-in duration-500" />
                      <p className="text-sm text-muted-foreground">Address</p>
                    </div>
                    <p className="font-medium text-sm md:text-base break-words">{order.deliveryAddress}</p>
                  </div>
                  {order.notes && (
                    <div className="animate-in fade-in duration-500 delay-300">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-4 w-4 text-muted-foreground animate-in fade-in duration-500" />
                        <p className="text-sm text-muted-foreground">Notes</p>
                      </div>
                      <p className="text-sm md:text-base break-words">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Information Card */}
              <Card className="animate-in fade-in slide-in-from-left-2 duration-500 delay-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <CreditCard className="h-5 w-5 animate-in fade-in duration-500" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="animate-in fade-in duration-500">
                      <p className="text-sm text-muted-foreground mb-1">Method</p>
                      <Badge 
                        variant="outline" 
                        className="capitalize hover:scale-105 transition-transform duration-200"
                      >
                        {order.paymentMethod}
                      </Badge>
                    </div>
                    <div className="animate-in fade-in duration-500 delay-100">
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge className={`${paymentStatus.color} hover:scale-105 transition-transform duration-200 flex items-center gap-1 w-fit`}>
                        {paymentStatus.icon}
                        {paymentStatus.label}
                      </Badge>
                    </div>
                  </div>
                  {order.mpesaReceiptNumber && (
                    <div className="animate-in fade-in duration-500 delay-200">
                      <p className="text-sm text-muted-foreground mb-1">M-Pesa Receipt</p>
                      <p className="font-mono text-sm md:text-base bg-muted p-2 rounded animate-pulse">
                        {order.mpesaReceiptNumber}
                      </p>
                    </div>
                  )}
                  {order.mpesaCheckoutId && (
                    <div className="animate-in fade-in duration-500 delay-300">
                      <p className="text-sm text-muted-foreground mb-1">Checkout ID</p>
                      <p className="font-mono text-xs md:text-sm break-all bg-muted p-2 rounded">
                        {order.mpesaCheckoutId}
                    </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary & Actions */}
            <div className="space-y-4 md:space-y-6">
              {/* Order Status Card */}
              <Card className="animate-in fade-in slide-in-from-right-2 duration-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Order Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={`${status.color} gap-1 px-3 py-1.5 hover:scale-105 transition-transform duration-200 animate-in fade-in`}>
                      {status.icon}
                      <span>{status.label}</span>
                    </Badge>
                  </div>
                  
                  <Separator className="animate-in fade-in duration-500 delay-100" />
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm animate-in fade-in duration-500">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Order Date:</span>
                      <span>{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm animate-in fade-in duration-500 delay-100">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span>{new Date(order.updatedAt).toLocaleString()}</span>
                    </div>
                    {order.userId && (
                      <div className="flex items-center gap-2 text-sm animate-in fade-in duration-500 delay-200">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">User ID:</span>
                        <Link href={`/admin/users?search=${order.userId}`}>
                          <Button 
                            variant="link" 
                            className="h-auto p-0 text-sm hover:scale-105 transition-transform duration-200"
                          >
                            {order.userId}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary Card */}
              <Card className="animate-in fade-in slide-in-from-right-2 duration-500 delay-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm animate-in fade-in duration-500">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>KSh {parseFloat(order.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm animate-in fade-in duration-500 delay-100">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>KSh {parseFloat(order.deliveryFee).toLocaleString()}</span>
                    </div>
                    <Separator className="animate-in fade-in duration-500 delay-200" />
                    <div className="flex justify-between font-bold text-base md:text-lg animate-in fade-in duration-500 delay-300">
                      <span>Total</span>
                      <span className="text-primary animate-pulse">KSh {parseFloat(order.total).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <Separator className="my-3 animate-in fade-in duration-500 delay-400" />
                  
                  <div className="space-y-2">
                    <Button
                      onClick={() => downloadInvoiceHandler("customer")}
                      variant="outline"
                      className="w-full gap-2 hover:scale-105 transition-transform duration-200 animate-in fade-in duration-500"
                      disabled={downloading}
                    >
                      {downloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>Download Customer Invoice</span>
                    </Button>
                    
                    <Button
                      onClick={() => window.open(`mailto:?subject=Order ${order.orderNumber}&body=Order Details:%0AOrder Number: ${order.orderNumber}%0ATotal: KSh ${parseFloat(order.total).toLocaleString()}%0AStatus: ${status.label}%0APayment: ${paymentStatus.label}`)}
                      variant="outline"
                      className="w-full gap-2 hover:scale-105 transition-transform duration-200 animate-in fade-in duration-500 delay-100"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Email Details</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card className="animate-in fade-in slide-in-from-right-2 duration-500 delay-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Select
                      value={order.status}
                      onValueChange={(value) => {
                        updateOrderMutation.mutate({ status: value });
                      }}
                    >
                      <SelectTrigger className="w-full hover:scale-105 transition-transform duration-200">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem 
                            key={option} 
                            value={option}
                            className="hover:scale-105 transition-transform duration-200"
                          >
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={order.paymentStatus}
                      onValueChange={(value) => {
                        updateOrderMutation.mutate({ paymentStatus: value });
                      }}
                    >
                      <SelectTrigger className="w-full hover:scale-105 transition-transform duration-200">
                        <SelectValue placeholder="Update Payment Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentStatusOptions.map((option) => (
                          <SelectItem 
                            key={option} 
                            value={option}
                            className="hover:scale-105 transition-transform duration-200"
                          >
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Order Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
          <DialogHeader>
            <DialogTitle className="animate-in fade-in duration-500">
              Edit Order #{order.orderNumber}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 animate-in fade-in duration-500">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm({...editForm, status: value})}
                >
                  <SelectTrigger className="hover:scale-105 transition-transform duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem 
                        key={option} 
                        value={option}
                        className="hover:scale-105 transition-transform duration-200"
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 animate-in fade-in duration-500 delay-100">
                <label className="text-sm font-medium">Payment Status</label>
                <Select
                  value={editForm.paymentStatus}
                  onValueChange={(value) => setEditForm({...editForm, paymentStatus: value})}
                >
                  <SelectTrigger className="hover:scale-105 transition-transform duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatusOptions.map((option) => (
                      <SelectItem 
                        key={option} 
                        value={option}
                        className="hover:scale-105 transition-transform duration-200"
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2 animate-in fade-in duration-500 delay-200">
              <label className="text-sm font-medium">Delivery Name</label>
              <Input
                value={editForm.deliveryName}
                onChange={(e) => setEditForm({...editForm, deliveryName: e.target.value})}
                className="hover:scale-105 transition-transform duration-200"
              />
            </div>
            
            <div className="space-y-2 animate-in fade-in duration-500 delay-300">
              <label className="text-sm font-medium">Delivery Phone</label>
              <Input
                value={editForm.deliveryPhone}
                onChange={(e) => setEditForm({...editForm, deliveryPhone: e.target.value})}
                className="hover:scale-105 transition-transform duration-200"
              />
            </div>
            
            <div className="space-y-2 animate-in fade-in duration-500 delay-400">
              <label className="text-sm font-medium">Delivery Address</label>
              <Textarea
                value={editForm.deliveryAddress}
                onChange={(e) => setEditForm({...editForm, deliveryAddress: e.target.value})}
                rows={3}
                className="hover:scale-105 transition-transform duration-200"
              />
            </div>
            
            <div className="space-y-2 animate-in fade-in duration-500 delay-500">
              <label className="text-sm font-medium">Order Notes</label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                rows={3}
                placeholder="Add any order notes..."
                className="hover:scale-105 transition-transform duration-200"
              />
            </div>
          </div>
          
          <DialogFooter className="animate-in fade-in duration-500 delay-600">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updateOrderMutation.isPending}
              className="hover:scale-105 transition-transform duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updateOrderMutation.isPending}
              className="hover:scale-105 transition-transform duration-200"
            >
              {updateOrderMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}