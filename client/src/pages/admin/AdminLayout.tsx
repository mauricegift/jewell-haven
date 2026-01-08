import { Link, useLocation } from "wouter";
import { Package, Users, ShoppingCart, LayoutDashboard, Mail, ChevronLeft, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/contacts", label: "Contacts", icon: Mail },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  // Handle scroll for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You don't have permission to access this page.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className={`md:hidden sticky top-0 z-50 bg-card transition-shadow duration-200 ${isScrolled ? 'shadow-sm' : ''}`}>
        <div className="flex items-center justify-between p-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.profilePicture || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user?.name?.charAt(0).toUpperCase() || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="capitalize text-xs">
                      {user?.role}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={logout}
                      className="h-8 gap-1"
                    >
                      <LogOut className="h-3 w-3" />
                      Logout
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1 p-2 space-y-1">
                  {navItems.map((item) => {
                    const isActive = location === item.href || 
                      (item.href !== "/admin" && location.startsWith(item.href));
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </div>
                      </Link>
                    );
                  })}
                </div>
                
                <div className="p-4 border-t">
                  <Link href="/">
                    <Button variant="outline" className="w-full gap-2">
                      <ChevronLeft className="h-4 w-4" />
                      Back to Store
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1 ml-3">
            <h2 className="font-serif text-lg font-bold text-primary truncate">
              {navItems.find(item => 
                location === item.href || 
                (item.href !== "/admin" && location.startsWith(item.href))
              )?.label || "Admin Panel"}
            </h2>
          </div>

          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex">
              <ChevronLeft className="h-4 w-4" />
              Store
            </Button>
            <Button variant="ghost" size="icon" className="sm:hidden h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="px-4 pb-3">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = location === item.href || 
                (item.href !== "/admin" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={`gap-1.5 whitespace-nowrap text-xs sm:text-sm rounded-full ${
                      isActive ? 'shadow-sm' : ''
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">{item.label}</span>
                    <span className="xs:hidden">{item.label.split(' ')[0]}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex min-h-screen">
        <aside className="w-64 flex-shrink-0 bg-card border-r flex flex-col sticky top-0 h-screen">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.profilePicture || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                <Badge variant="secondary" className="mt-1 capitalize text-xs">
                  {user?.role}
                </Badge>
              </div>
            </div>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Store
              </Button>
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location === item.href || 
                  (item.href !== "/admin" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                      data-testid={`link-admin-${item.label.toLowerCase()}`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2" 
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Main Content */}
      <main className="md:hidden min-h-screen">
        <div className="p-4">
          {children}
        </div>
      </main>

      {/* Import the Badge component */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// Need to define Badge component since it wasn't imported
const Badge = ({ variant = "default", className = "", children }: any) => {
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input bg-background",
  };
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};