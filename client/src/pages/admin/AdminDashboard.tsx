import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Package, Users, ShoppingCart, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "./AdminLayout";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: Array<{
    id: number;
    orderNumber: string;
    total: string;
    status: string;
    createdAt: string;
  }>;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  delivered: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
};

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animation delays for staggered entrance
  const cardDelays = [0, 100, 200, 300];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="font-serif text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your admin dashboard</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card 
                className={`overflow-hidden transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${cardDelays[0]}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Products</p>
                      <p className="text-2xl font-bold transition-all duration-300 hover:scale-105 inline-block" data-testid="stat-products">
                        {stats?.totalProducts || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 transition-transform duration-300 hover:scale-110">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-4 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: mounted ? '100%' : '0%' }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={`overflow-hidden transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${cardDelays[1]}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold transition-all duration-300 hover:scale-105 inline-block" data-testid="stat-orders">
                        {stats?.totalOrders || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 transition-transform duration-300 hover:scale-110">
                      <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="mt-4 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: mounted ? '100%' : '0%' }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={`overflow-hidden transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${cardDelays[2]}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold transition-all duration-300 hover:scale-105 inline-block" data-testid="stat-users">
                        {stats?.totalUsers || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 transition-transform duration-300 hover:scale-110">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="mt-4 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 dark:bg-purple-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: mounted ? '100%' : '0%' }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={`overflow-hidden transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${cardDelays[3]}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold transition-all duration-300 hover:scale-105 inline-block" data-testid="stat-revenue">
                        KSh {(stats?.totalRevenue || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900 transition-transform duration-300 hover:scale-110">
                      <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <div className="mt-4 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: mounted ? '100%' : '0%' }}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card 
          className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '400ms' }}
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/admin/orders">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 transition-all duration-300 hover:gap-3 hover:shadow-md" 
                data-testid="button-view-all-orders"
              >
                View All
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    className="h-16 w-full animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {stats.recentOrders.map((order, index) => (
                  <Link key={order.id} href={`/admin/orders/${order.orderNumber}`}>
                    <div 
                      className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary/20 hover:scale-[1.005] hover:bg-gradient-to-r hover:from-transparent hover:to-primary/5 dark:hover:to-primary/10 group"
                      style={{ 
                        transitionDelay: `${index * 50}ms`,
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'translateX(0)' : 'translateX(-20px)'
                      }}
                    >
                      <div>
                        <p className="font-medium transition-colors duration-300 group-hover:text-primary">
                          Order #{order.orderNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium transition-all duration-300 group-hover:scale-105">
                          KSh {parseFloat(order.total).toLocaleString()}
                        </p>
                        <Badge 
                          className={`transition-all duration-300 group-hover:scale-105 ${statusColors[order.status] || ""}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div 
                className="text-center py-8 text-muted-foreground transition-all duration-500"
                style={{ 
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'scale(1)' : 'scale(0.95)'
                }}
              >
                No orders yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}