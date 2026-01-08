import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Menu, Search, ShoppingBag, User, Sun, Moon, Monitor, LogOut, 
  Settings, LayoutDashboard, X, Sparkles, Home, ShoppingCart, 
  Grid3x3, Briefcase, Info, Phone, Heart, Gem, Clock, Circle,
  Watch, CircleDot, Crown, Sparkle, CircleOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useCart } from "@/lib/cart";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Updated navLinks with icons
const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: ShoppingCart },
  { href: "#", label: "Categories", icon: Grid3x3 },
  { href: "/services", label: "Services", icon: Briefcase },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: Phone },
];

// Categories data - replaced both Necklace and Earrings with alternative icons
const categories = [
  { id: "rings", label: "Rings", icon: CircleDot },
  { id: "necklaces", label: "Necklaces", icon: Circle }, // Changed from Necklace to Circle
  { id: "earrings", label: "Earrings", icon: CircleOff }, // Changed from Earrings to CircleOff
  { id: "bracelets", label: "Bracelets", icon: Heart },
  { id: "watches", label: "Watches", icon: Watch },
  { id: "pendants", label: "Pendants", icon: Gem },
  { id: "engagement", label: "Engagement", icon: Sparkle },
  { id: "luxury", label: "Luxury", icon: Crown },
];

export function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  // Handle scroll effect for header elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle clicking outside categories dropdown on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isCategoriesOpen && !target.closest('[data-categories]')) {
        setIsCategoriesOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isCategoriesOpen]);

  const CategoryIcon = ({ categoryId, className }: { categoryId: string, className?: string }) => {
    const category = categories.find(c => c.id === categoryId);
    const IconComponent = category?.icon || CircleDot;
    return <IconComponent className={className} />;
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      scrolled 
        ? "bg-background/95 backdrop-blur-xl border-b shadow-lg" 
        : "bg-background/90 backdrop-blur-md border-b"
    )}>
      {/* Curved bottom edges */}
      <div className="relative">
        <div className="absolute -bottom-0 left-0 right-0 h-8 overflow-hidden pointer-events-none">
          {/* Left curved edge */}
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-background/90 backdrop-blur-md rounded-full -translate-x-1/2 translate-y-1/2" />
          {/* Right curved edge */}
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-background/90 backdrop-blur-md rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
      </div>

      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between gap-4 px-4 md:px-6 relative">
        {/* Logo and Mobile Menu */}
        <div className="flex items-center gap-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-primary/10 hover:text-primary transition-all duration-200"
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] border-r-0 rounded-r-2xl">
              {/* Curved right edge for mobile menu */}
              <div className="absolute -right-8 top-0 bottom-0 w-8 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-16 h-16 bg-background border-l border-border/50 rounded-l-full -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-16 h-16 bg-background border-l border-border/50 rounded-l-full translate-y-1/2" />
              </div>
              
              <SheetHeader className="border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
                    <img 
                      src="/logo.png" 
                      alt="Jewel Haven Logo" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23FBBF24'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='24' fill='white'%3EJH%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <SheetTitle className="font-serif text-xl text-primary">
                    JEWEL HAVEN
                  </SheetTitle>
                </div>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-6">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  if (link.label === "Categories") {
                    return (
                      <div key={link.href} className="relative" data-categories>
                        <button
                          onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                          className={cn(
                            "flex items-center w-full px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 group",
                            "text-foreground hover:bg-primary/5 hover:text-primary"
                          )}
                        >
                          <span className={cn(
                            "w-1 h-6 bg-primary rounded-full mr-3 transition-all duration-300",
                            "opacity-0 group-hover:opacity-100"
                          )} />
                          <Icon className="mr-3 h-5 w-5" />
                          {link.label}
                          <ChevronDown className={cn(
                            "ml-auto h-4 w-4 transition-transform duration-200",
                            isCategoriesOpen && "rotate-180"
                          )} />
                        </button>
                        
                        {/* Mobile Categories Dropdown */}
                        {isCategoriesOpen && (
                          <div className="ml-8 mt-2 mb-2 space-y-1 animate-in slide-in-from-left-2 duration-200">
                            {categories.map((category) => {
                              const CategoryIcon = category.icon;
                              return (
                                <SheetClose asChild key={category.id}>
                                  <Link
                                    href={`/shop?category=${category.id}`}
                                    className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary/5 hover:text-primary hover:pl-6 group"
                                  >
                                    <CategoryIcon className="mr-3 h-4 w-4" />
                                    {category.label}
                                  </Link>
                                </SheetClose>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 group",
                          location === link.href
                            ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
                            : "text-foreground hover:bg-primary/5 hover:text-primary hover:pl-6"
                        )}
                        data-testid={`link-nav-${link.label.toLowerCase()}`}
                      >
                        <span className={cn(
                          "w-1 h-6 bg-primary rounded-full mr-3 transition-all duration-300",
                          location === link.href ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )} />
                        <Icon className="mr-3 h-5 w-5" />
                        {link.label}
                        {location === link.href && (
                          <Sparkles className="ml-auto h-4 w-4" />
                        )}
                      </Link>
                    </SheetClose>
                  );
                })}
                
                <div className="border-t my-4" />
                
                {user ? (
                  <>
                    <SheetClose asChild>
                      <Link
                        href="/account"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:bg-primary/5 hover:text-primary hover:pl-6 group"
                        data-testid="link-account"
                      >
                        <User className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                        My Account
                      </Link>
                    </SheetClose>
                    {isAdmin && (
                      <SheetClose asChild>
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:bg-primary/5 hover:text-primary hover:pl-6 group"
                          data-testid="link-admin"
                        >
                          <LayoutDashboard className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                          Admin Dashboard
                        </Link>
                      </SheetClose>
                    )}
                    <SheetClose asChild>
                      <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-destructive transition-all duration-200 hover:bg-destructive/5 hover:pl-6 w-full text-left group"
                        data-testid="button-logout-mobile"
                      >
                        <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                        Logout
                      </button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link
                        href="/login"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:bg-primary/5 hover:text-primary hover:pl-6 group"
                        data-testid="link-login-mobile"
                      >
                        <User className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                        Login
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/signup"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary hover:shadow-lg transition-all duration-200 mt-2"
                        data-testid="link-signup-mobile"
                      >
                        Sign Up
                      </Link>
                    </SheetClose>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
          
          {/* Logo with circular image - Updated for mobile */}
          <Link 
            href="/" 
            className="flex items-center gap-3 group" 
            data-testid="link-logo"
          >
            <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all duration-300">
                <img 
                  src="/logo.png" 
                  alt="Jewel Haven Logo" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23FBBF24'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='24' fill='white'%3EJH%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-primary/30 transition-all duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-base md:text-2xl font-bold text-primary tracking-wide group-hover:text-primary/90 transition-colors duration-300 whitespace-nowrap">
                JEWEL HAVEN
              </span>
              <span className="text-xs text-muted-foreground -mt-1 hidden md:block">
                Luxury Redefined
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            
            if (link.label === "Categories") {
              return (
                <DropdownMenu key={link.href}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                        "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                      {/* Hover underline effect */}
                      <span className={cn(
                        "absolute bottom-0 left-1/2 h-0.5 bg-primary rounded-full -translate-x-1/2 transition-all duration-300",
                        "w-0 group-hover:w-8"
                      )} />
                      {/* Hover background effect */}
                      <span className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="center" 
                    className="w-48 border-2 rounded-xl mt-2"
                    data-categories
                  >
                    {categories.map((category) => {
                      const CategoryIcon = category.icon;
                      return (
                        <DropdownMenuItem key={category.id} asChild>
                          <Link
                            href={`/shop?category=${category.id}`}
                            className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 hover:bg-primary/5 hover:text-primary rounded-lg"
                          >
                            <CategoryIcon className="h-4 w-4 text-primary/70" />
                            {category.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                  location === link.href
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`link-nav-${link.label.toLowerCase()}`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
                {/* Hover underline effect */}
                <span className={cn(
                  "absolute bottom-0 left-1/2 h-0.5 bg-primary rounded-full -translate-x-1/2 transition-all duration-300",
                  location === link.href ? "w-8" : "w-0 group-hover:w-8"
                )} />
                {/* Hover background effect */}
                <span className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Link href="/shop">
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
              data-testid="button-search"
            >
              <Search className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="sr-only">Search</span>
            </Button>
          </Link>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
                data-testid="button-theme"
              >
                {resolvedTheme === "dark" ? (
                  <Moon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                ) : (
                  <Sun className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-2 rounded-xl">
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className={cn(
                  "cursor-pointer transition-colors duration-200 rounded-lg",
                  theme === "light" ? "bg-primary/10 text-primary" : "hover:bg-primary/5 hover:text-primary"
                )}
                data-testid="button-theme-light"
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
                {theme === "light" && <Sparkles className="ml-auto h-3 w-3" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className={cn(
                  "cursor-pointer transition-colors duration-200 rounded-lg",
                  theme === "dark" ? "bg-primary/10 text-primary" : "hover:bg-primary/5 hover:text-primary"
                )}
                data-testid="button-theme-dark"
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
                {theme === "dark" && <Sparkles className="ml-auto h-3 w-3" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className={cn(
                  "cursor-pointer transition-colors duration-200 rounded-lg",
                  theme === "system" ? "bg-primary/10 text-primary" : "hover:bg-primary/5 hover:text-primary"
                )}
                data-testid="button-theme-system"
              >
                <Monitor className="mr-2 h-4 w-4" />
                System
                {theme === "system" && <Sparkles className="ml-auto h-3 w-3" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cart */}
          <Link href="/cart">
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
              data-testid="button-cart"
            >
              <ShoppingBag className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              {totalItems > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs border-2 border-background bg-gradient-to-r from-primary to-primary/80 shadow-md animate-pulse"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </Badge>
              )}
              <span className="sr-only">Shopping cart</span>
            </Button>
          </Link>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
                data-testid="button-user-menu"
              >
                {user?.profilePicture ? (
                  <div className="relative">
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary transition-all duration-200"
                    />
                    <div className="absolute inset-0 rounded-full ring-2 ring-transparent group-hover:ring-primary/30 transition-all duration-200" />
                  </div>
                ) : (
                  <User className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                )}
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-2 rounded-xl">
              {user ? (
                <>
                  <div className="px-3 py-2 border-b">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="rounded-lg">
                    <Link 
                      href="/account#profile" 
                      className="cursor-pointer transition-colors duration-200 hover:bg-primary/5 hover:text-primary"
                      data-testid="link-account-dropdown"
                    >
                      <User className="mr-2 h-4 w-4" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg">
                    <Link 
                      href="/account#orders" 
                      className="cursor-pointer transition-colors duration-200 hover:bg-primary/5 hover:text-primary"
                      data-testid="link-orders-dropdown"
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-lg">
                        <Link 
                          href="/admin" 
                          className="cursor-pointer transition-colors duration-200 hover:bg-primary/5 hover:text-primary"
                          data-testid="link-admin-dropdown"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-destructive hover:bg-destructive/5 transition-colors duration-200 rounded-lg"
                    data-testid="button-logout-dropdown"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild className="rounded-lg">
                    <Link 
                      href="/login" 
                      className="cursor-pointer transition-colors duration-200 hover:bg-primary/5 hover:text-primary"
                      data-testid="link-login-dropdown"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg">
                    <Link 
                      href="/signup" 
                      className="cursor-pointer transition-colors duration-200 hover:bg-primary/5 hover:text-primary"
                      data-testid="link-signup-dropdown"
                    >
                      Sign Up
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

// ChevronDown icon component for mobile menu
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}