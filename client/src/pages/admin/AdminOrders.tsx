import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Eye, Loader2, Download, Phone, User, Calendar, CreditCard, ChevronRight, Menu, Filter, X, Package, Truck, CheckCircle, AlertCircle, Clock, ArrowUpDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AdminLayout } from "./AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, downloadInvoice } from "@/lib/queryClient";
import type { Order, OrderItem } from "@shared/schema";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: {
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    icon: <Clock className="h-3 w-3" />,
    label: "Pending",
  },
  processing: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    icon: <Package className="h-3 w-3" />,
    label: "Processing",
  },
  paid: {
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: <CheckCircle className="h-3 w-3" />,
    label: "Paid",
  },
  delivered: {
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    icon: <Truck className="h-3 w-3" />,
    label: "Delivered",
  },
  completed: {
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    icon: <CheckCircle className="h-3 w-3" />,
    label: "Completed",
  },
  cancelled: {
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    icon: <AlertCircle className="h-3 w-3" />,
    label: "Cancelled",
  },
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  delivered: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statuses = ["all", "pending", "processing", "paid", "delivered", "completed", "cancelled"];

export default function AdminOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<"list" | "grid">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "total" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [animateRefresh, setAnimateRefresh] = useState(false);

  const { data: orders, isLoading, refetch } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/admin/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return apiRequest("PATCH", `/api/admin/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Status updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not update status",
        variant: "destructive",
      });
    },
  });

  const downloadAdminInvoice = async (orderNumber: string) => {
    try {
      setDownloadingInvoice(orderNumber);
      await downloadInvoice(orderNumber, "admin");
      
      toast({
        title: "Invoice downloaded",
        description: "Admin invoice has been downloaded successfully.",
      });
    } catch (error: any) {
      console.error("Download invoice error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const viewOrderDetails = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleRefresh = () => {
    setAnimateRefresh(true);
    refetch();
    setTimeout(() => setAnimateRefresh(false), 500);
  };

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.deliveryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.deliveryPhone.includes(searchQuery) ||
      order.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = filteredOrders ? [...filteredOrders].sort((a, b) => {
    if (sortBy === "date") {
      return sortOrder === "asc" 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "total") {
      return sortOrder === "asc" 
        ? parseFloat(a.total) - parseFloat(b.total)
        : parseFloat(b.total) - parseFloat(a.total);
    }
    if (sortBy === "name") {
      return sortOrder === "asc"
        ? a.deliveryName.localeCompare(b.deliveryName)
        : b.deliveryName.localeCompare(a.deliveryName);
    }
    return 0;
  }) : [];

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in slide-in-from-top-2 duration-500">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent animate-in fade-in duration-700">
              Orders
            </h1>
            <p className="text-sm md:text-base text-muted-foreground animate-in fade-in duration-700 delay-100">
              Manage customer orders and track deliveries
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto animate-in slide-in-from-right-2 duration-500 delay-150">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 sm:w-auto sm:px-3"
              title="Refresh orders"
            >
              <RefreshCw className={`h-4 w-4 ${animateRefresh ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Refresh</span>
            </Button>
            
            <div className="hidden sm:flex gap-2 border rounded-lg p-1 bg-background/50 backdrop-blur-sm">
              <Button
                variant={mobileViewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMobileViewMode("list")}
                className="h-8 px-3 hover:scale-105 transition-transform duration-200"
              >
                List
              </Button>
              <Button
                variant={mobileViewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMobileViewMode("grid")}
                className="h-8 px-3 hover:scale-105 transition-transform duration-200"
              >
                Grid
              </Button>
            </div>
          </div>
        </div>

        {/* Main Card with Filters and Table */}
        <Card className="overflow-hidden border-0 shadow-lg animate-in fade-in duration-500">
          <CardHeader className="p-4 md:p-6 pb-3">
            <div className="flex flex-col gap-4">
              {/* Mobile Search Bar */}
              <div className="relative animate-in fade-in duration-500">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-pulse" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm md:text-base h-11 transition-all duration-300 focus:ring-2 focus:ring-primary"
                  data-testid="input-search-orders"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Mobile Filter Toggle */}
              <div className="sm:hidden animate-in fade-in duration-500 delay-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full hover:scale-105 transition-transform duration-200"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              </div>

              {/* Filters - Hidden on mobile unless toggled */}
              <div className={`${showFilters ? 'block animate-in fade-in duration-300' : 'hidden'} sm:block`}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex gap-2 flex-wrap">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px] text-sm md:text-base animate-in fade-in duration-300 hover:scale-105 transition-transform" data-testid="select-status-filter">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status} className="text-sm md:text-base hover:scale-105 transition-transform">
                            {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="animate-in fade-in duration-300 delay-100 hover:scale-105 transition-transform">
                          <ArrowUpDown className="h-4 w-4 mr-2" />
                          Sort
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder("desc"); }}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Newest First
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSortBy("date"); setSortOrder("asc"); }}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Oldest First
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSortBy("total"); setSortOrder("desc"); }}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Highest Total
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSortBy("total"); setSortOrder("asc"); }}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Lowest Total
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSortBy("name"); setSortOrder("asc"); }}>
                          <User className="h-4 w-4 mr-2" />
                          Name A-Z
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Clear filters button for mobile */}
                  {showFilters && (searchQuery || statusFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                        setSortBy("date");
                        setSortOrder("desc");
                      }}
                      className="sm:hidden animate-in fade-in duration-300"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Mobile View Mode Toggle */}
              <div className="sm:hidden flex gap-2 animate-in fade-in duration-500 delay-200">
                <Button
                  variant={mobileViewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMobileViewMode("list")}
                  className="flex-1 hover:scale-105 transition-transform duration-200"
                >
                  List View
                </Button>
                <Button
                  variant={mobileViewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMobileViewMode("grid")}
                  className="flex-1 hover:scale-105 transition-transform duration-200"
                >
                  Card View
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 md:p-6">
            {isLoading ? (
              <div className="space-y-4 p-4 md:p-0 animate-in fade-in duration-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 md:h-16 w-full animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
              </div>
            ) : sortedOrders && sortedOrders.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto animate-in fade-in duration-500">
                  <Table>
                    <TableHeader>
                      <TableRow className="animate-in fade-in duration-500">
                        <TableHead className="text-sm md:text-base">Order #</TableHead>
                        <TableHead className="text-sm md:text-base">Customer</TableHead>
                        <TableHead className="text-sm md:text-base">Date</TableHead>
                        <TableHead className="text-sm md:text-base">Total</TableHead>
                        <TableHead className="text-sm md:text-base">Payment</TableHead>
                        <TableHead className="text-sm md:text-base">Status</TableHead>
                        <TableHead className="text-right text-sm md:text-base">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedOrders.map((order, index) => (
                        <TableRow 
                          key={order.id} 
                          data-testid={`row-order-${order.id}`}
                          className="animate-in fade-in slide-in-from-left-2 duration-300 hover:bg-muted/50 transition-colors"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <TableCell className="font-mono font-medium text-sm md:text-base">
                            <Link 
                              href={`/admin/orders/${order.orderNumber}`} 
                              className="hover:text-primary hover:underline transition-colors duration-200 group flex items-center gap-2"
                            >
                              <span className="group-hover:scale-110 transition-transform duration-200">
                                #{order.orderNumber}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="animate-in fade-in duration-300">
                              <p className="font-medium text-sm md:text-base">{order.deliveryName}</p>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                {order.deliveryPhone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col animate-in fade-in duration-300 delay-100">
                              <span className="text-sm md:text-base">{new Date(order.createdAt).toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-sm md:text-base animate-in fade-in duration-300 delay-200">
                              KSh {parseFloat(order.total).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 animate-in fade-in duration-300 delay-300">
                              <Badge variant="outline" className="capitalize text-xs md:text-sm hover:scale-105 transition-transform duration-200">
                                {order.paymentMethod}
                              </Badge>
                              <Badge
                                variant={order.paymentStatus === "paid" ? "default" : "secondary"}
                                className="block w-fit capitalize text-xs md:text-sm hover:scale-105 transition-transform duration-200"
                              >
                                {order.paymentStatus}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(status) =>
                                updateStatusMutation.mutate({ orderId: order.id, status })
                              }
                            >
                              <SelectTrigger className="w-[130px] h-8 text-sm hover:scale-105 transition-transform duration-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="animate-in zoom-in-95 duration-200">
                                {statuses.slice(1).map((status) => (
                                  <SelectItem key={status} value={status} className="text-sm hover:scale-105 transition-transform duration-200">
                                    <div className="flex items-center gap-2">
                                      {statusConfig[status]?.icon}
                                      <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 animate-in fade-in duration-300 delay-400">
                              <Link href={`/admin/orders/${order.orderNumber}`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:scale-110 transition-transform duration-200 hover:bg-primary/10"
                                  data-testid={`button-view-${order.id}`}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:scale-110 transition-transform duration-200 hover:bg-primary/10"
                                onClick={() => downloadAdminInvoice(order.orderNumber)}
                                disabled={downloadingInvoice === order.orderNumber}
                                title="Download Invoice"
                              >
                                {downloadingInvoice === order.orderNumber ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Grid/Card View */}
                <div className={`md:hidden space-y-3 p-4 ${mobileViewMode === "grid" ? "block animate-in fade-in duration-500" : "hidden"}`}>
                  {sortedOrders.map((order, index) => (
                    <Card 
                      key={order.id} 
                      className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => viewOrderDetails(order)}
                    >
                      <CardContent className="p-0">
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="min-w-0">
                              <h3 className="font-medium text-base text-primary hover:underline truncate">
                                #{order.orderNumber}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                <Calendar className="inline h-3 w-3 mr-1" />
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={`${statusColors[order.status] || ""} capitalize text-xs flex items-center gap-1 hover:scale-105 transition-transform duration-200`}>
                              {statusConfig[order.status]?.icon}
                              {order.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 animate-in fade-in duration-300">
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm truncate">{order.deliveryName}</span>
                            </div>
                            <div className="flex items-center gap-2 animate-in fade-in duration-300 delay-100">
                              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm">{order.deliveryPhone}</span>
                            </div>
                            <div className="flex items-center gap-2 animate-in fade-in duration-300 delay-200">
                              <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm capitalize">{order.paymentMethod} • {order.paymentStatus}</span>
                            </div>
                          </div>
                          
                          <Separator className="my-3 animate-in fade-in duration-300 delay-300" />
                          
                          <div className="flex justify-between items-center">
                            <div className="animate-in fade-in duration-300 delay-400">
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="font-medium text-base">KSh {parseFloat(order.total).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:scale-110 transition-transform duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewOrderDetails(order);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Mobile List View */}
                <div className={`md:hidden space-y-2 p-4 ${mobileViewMode === "list" ? "block animate-in fade-in duration-500" : "hidden"}`}>
                  {sortedOrders.map((order, index) => (
                    <div 
                      key={order.id} 
                      className="border rounded-lg p-3 space-y-2 hover:shadow-md transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-left-2 duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm text-primary hover:underline truncate">
                              #{order.orderNumber}
                            </h3>
                            <Badge className={`${statusColors[order.status] || ""} capitalize text-xs flex items-center gap-1`}>
                              {statusConfig[order.status]?.icon}
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            <User className="inline h-3 w-3 mr-1" />
                            {order.deliveryName} • <Phone className="inline h-3 w-3 mx-1" />
                            {order.deliveryPhone}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {new Date(order.createdAt).toLocaleDateString()} • {order.paymentMethod}
                          </p>
                        </div>
                        <div className="text-right animate-in fade-in duration-300 delay-200">
                          <p className="font-medium text-sm">KSh {parseFloat(order.total).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t animate-in fade-in duration-300 delay-300">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2 hover:scale-105 transition-transform duration-200">
                              <Menu className="h-3 w-3 mr-1" />
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="animate-in zoom-in-95 duration-200">
                            <DropdownMenuItem onClick={() => viewOrderDetails(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => downloadAdminInvoice(order.orderNumber)}
                              disabled={downloadingInvoice === order.orderNumber}
                            >
                              {downloadingInvoice === order.orderNumber ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4 mr-2" />
                              )}
                              Download Invoice
                            </DropdownMenuItem>
                            <Separator />
                            {statuses.slice(1).map((status) => (
                              <DropdownMenuItem 
                                key={status}
                                onClick={() => updateStatusMutation.mutate({ orderId: order.id, status })}
                                className="hover:scale-105 transition-transform duration-200"
                              >
                                <div className="flex items-center gap-2">
                                  {statusConfig[status]?.icon}
                                  <span className="capitalize">{status}</span>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Link href={`/admin/orders/${order.orderNumber}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-3 hover:scale-105 transition-transform duration-200 group">
                            Open
                            <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 md:py-12 px-4 animate-in fade-in duration-500">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 flex items-center justify-center animate-bounce">
                  <Search className="h-6 w-6 md:h-8 md:w-8 text-primary animate-pulse" />
                </div>
                <h3 className="text-base md:text-lg font-medium mb-2 animate-in fade-in duration-300">No orders found</h3>
                <p className="text-sm md:text-base text-muted-foreground mb-4 animate-in fade-in duration-300 delay-100">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "There are no orders yet"}
                </p>
                {(searchQuery || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                    className="text-sm animate-in fade-in duration-300 delay-200 hover:scale-105 transition-transform duration-200"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-full animate-in zoom-in-95 duration-300">
            <DialogHeader className="animate-in fade-in duration-500">
              <DialogTitle className="text-lg md:text-xl flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Order #{selectedOrder?.orderNumber}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6 animate-in fade-in duration-500 delay-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                    <h4 className="font-medium mb-2 text-sm md:text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Details
                    </h4>
                    <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                      <p className="text-sm md:text-base">{selectedOrder.deliveryName}</p>
                      <p className="text-sm text-muted-foreground">
                        <Phone className="inline h-3 w-3 mr-1" />
                        {selectedOrder.deliveryPhone}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {selectedOrder.deliveryAddress}
                      </p>
                    </div>
                  </div>
                  <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                    <h4 className="font-medium mb-2 text-sm md:text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Order Info
                    </h4>
                    <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                      <p className="text-sm">
                        Date: {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm">
                        Payment: {selectedOrder.paymentMethod.toUpperCase()}
                      </p>
                      {selectedOrder.mpesaReceiptNumber && (
                        <p className="text-sm animate-pulse">
                          M-Pesa Receipt: {selectedOrder.mpesaReceiptNumber}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge className={`${statusColors[selectedOrder.status] || ""} text-xs md:text-sm capitalize hover:scale-105 transition-transform duration-200 flex items-center gap-1`}>
                          {statusConfig[selectedOrder.status]?.icon}
                          {selectedOrder.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs md:text-sm capitalize hover:scale-105 transition-transform duration-200">
                          {selectedOrder.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="animate-in fade-in duration-300 delay-200">
                    <h4 className="font-medium mb-2 text-sm md:text-base flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Order Notes
                    </h4>
                    <p className="text-sm text-muted-foreground p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                <Separator className="animate-in fade-in duration-300 delay-300" />

                <div className="animate-in fade-in duration-300 delay-400">
                  <h4 className="font-medium mb-3 text-sm md:text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Order Items ({selectedOrder.items.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200 animate-in fade-in slide-in-from-left-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-10 h-10 md:w-12 md:h-12 object-cover rounded flex-shrink-0 hover:scale-110 transition-transform duration-200"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{item.productName}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            Qty: {item.quantity} • KSh{" "}
                            {parseFloat(item.price).toLocaleString()}
                          </p>
                        </div>
                        <p className="font-medium text-sm md:text-base whitespace-nowrap">
                          KSh{" "}
                          {(parseFloat(item.price) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="animate-in fade-in duration-300 delay-500" />

                <div className="space-y-2 animate-in fade-in duration-300 delay-600">
                  <div className="flex justify-between text-sm md:text-base">
                    <span>Subtotal</span>
                    <span>KSh {parseFloat(selectedOrder.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span>Delivery Fee</span>
                    <span>KSh {parseFloat(selectedOrder.deliveryFee).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base md:text-lg pt-2 border-t animate-pulse">
                    <span>Total</span>
                    <span className="text-primary">
                      KSh {parseFloat(selectedOrder.total).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4 animate-in fade-in duration-300 delay-700">
                  <Button
                    variant="outline"
                    onClick={() => downloadAdminInvoice(selectedOrder.orderNumber)}
                    disabled={downloadingInvoice === selectedOrder.orderNumber}
                    className="flex-1 text-sm md:text-base hover:scale-105 transition-transform duration-200"
                  >
                    {downloadingInvoice === selectedOrder.orderNumber ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Invoice
                      </>
                    )}
                  </Button>
                  <Link href={`/admin/orders/${selectedOrder.orderNumber}`}>
                    <Button className="flex-1 text-sm md:text-base hover:scale-105 transition-transform duration-200 group">
                      View Full Details
                      <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}