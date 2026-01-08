import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Truck, Shield, Award, RefreshCw, Sparkles, Gem, Crown, ChevronLeft, ChevronRight, Zap, Star, Heart, Eye, ShoppingBag, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@shared/schema";
import { useState, useEffect, useRef } from "react";

const features = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Swift delivery across Kenya with tracking",
    gradient: "from-emerald-500 to-teal-500",
    delay: "0ms"
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Safe M-Pesa & Cash on Delivery options",
    gradient: "from-blue-500 to-cyan-500",
    delay: "100ms"
  },
  {
    icon: Award,
    title: "Quality Assured",
    description: "Authentic, premium quality jewelry",
    gradient: "from-amber-500 to-orange-500",
    delay: "200ms"
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "Hassle-free returns within policy",
    gradient: "from-rose-500 to-pink-500",
    delay: "300ms"
  },
];

const categories = [
  { 
    name: "Rings", 
    icon: Sparkles, 
    href: "/shop?category=rings", 
    gradient: "from-rose-500 to-pink-500",
    emoji: "💍"
  },
  { 
    name: "Necklaces", 
    icon: Gem, 
    href: "/shop?category=necklaces", 
    gradient: "from-amber-500 to-orange-500",
    emoji: "📿"
  },
  { 
    name: "Earrings", 
    icon: Crown, 
    href: "/shop?category=earrings", 
    gradient: "from-sky-500 to-blue-500",
    emoji: "✨"
  },
  { 
    name: "Bracelets", 
    icon: Sparkles, 
    href: "/shop?category=bracelets", 
    gradient: "from-emerald-500 to-teal-500",
    emoji: "📿"
  },
];

export default function Home() {
  const { data: featuredProducts, isLoading: loadingFeatured } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  const { data: latestProducts, isLoading: loadingLatest } = useQuery<Product[]>({
    queryKey: ["/api/products/latest"],
  });

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const heroIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set(['hero']));
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use API featured products if available, otherwise use empty array
  const heroDisplayItems = featuredProducts || [];

  // Auto-rotate hero products
  useEffect(() => {
    const startAutoRotation = () => {
      if (heroDisplayItems.length > 1) {
        if (heroIntervalRef.current) clearInterval(heroIntervalRef.current);
        heroIntervalRef.current = setInterval(() => {
          setIsAnimating(true);
          setTimeout(() => {
            setCurrentHeroIndex((prev) => (prev + 1) % heroDisplayItems.length);
            setIsAnimating(false);
            setShowMobileDetails(false); // Reset detail view on slide change
          }, 500);
        }, 4000);
      }
    };
    startAutoRotation();
    return () => { if (heroIntervalRef.current) clearInterval(heroIntervalRef.current); };
  }, [heroDisplayItems.length]);

  const resetInterval = () => {
    if (heroIntervalRef.current) clearInterval(heroIntervalRef.current);
    heroIntervalRef.current = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroDisplayItems.length);
        setIsAnimating(false);
      }, 500);
    }, 4000);
  };

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            setVisibleSections((prev) => new Set([...prev, sectionId]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );
    Object.values(sectionRefs.current).forEach((ref) => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { width, height } = e.currentTarget.getBoundingClientRect();
    const x = (clientX / width - 0.5) * 20;
    const y = (clientY / height - 0.5) * 20;
    setMousePosition({ x, y });
  };

  const goToHeroProduct = (index: number) => {
    if (isAnimating || index === currentHeroIndex) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentHeroIndex(index);
      setIsAnimating(false);
      setShowMobileDetails(false);
    }, 300);
  };

  const nextHeroProduct = () => {
    if (isAnimating) return;
    goToHeroProduct((currentHeroIndex + 1) % heroDisplayItems.length);
    resetInterval();
  };

  const prevHeroProduct = () => {
    if (isAnimating) return;
    goToHeroProduct((currentHeroIndex - 1 + heroDisplayItems.length) % heroDisplayItems.length);
    resetInterval();
  };

  const isSectionVisible = (sectionId: string) => visibleSections.has(sectionId);

  const formatPriceKES = (price: any) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `KES ${numPrice.toLocaleString('en-KE')}`;
  };

  // Helper function to get product image
  const getProductImage = (product: any) => {
    if (product.image) return product.image; 
    if (product.images && product.images.length > 0) return product.images[0];
    return "/api/placeholder/400/300";
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section with animations */}
      <section 
        id="hero"
        ref={(el) => { sectionRefs.current['hero'] = el; }}
        className="relative pt-0 min-h-[600px] md:min-h-[800px] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-amber-900 dark:from-gray-950 dark:via-purple-950 dark:to-amber-950"
        onMouseMove={handleMouseMove}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-amber-500/10 to-rose-500/10 animate-float"
              style={{
                width: `${Math.random() * 100 + 20}px`,
                height: `${Math.random() * 100 + 20}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${Math.random() * 10 + 10}s`,
              }}
            />
          ))}
        </div>

        {/* Parallax layers */}
        <div 
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
          }}
        >
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-amber-500/20 to-rose-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-20 mt-4 md:mt-8 lg:mt-0">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Column - Hero Text with animations */}
            <div className="space-y-4 md:space-y-8">
              <h1 className={`font-serif text-3xl md:text-5xl lg:text-7xl font-bold leading-tight ${isSectionVisible('hero') ? 'animate-slide-in-left' : 'opacity-0'}`}>
                <span className="block bg-gradient-to-r from-amber-300 via-white to-rose-300 bg-clip-text text-transparent animate-gradient">
                  Luxury Jewelry
                </span>
                <span className="block text-white/90 mt-1 md:mt-2">Redefined</span>
              </h1>
              
              <p className={`text-lg md:text-xl text-white/70 leading-relaxed max-w-lg ${isSectionVisible('hero') ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
                Experience the pinnacle of craftsmanship with our exclusive collections. 
              </p>
              
              {/* Buttons - Fixed for mobile to be on same line */}
              <div className={`flex flex-row items-center gap-3 pt-2 ${isSectionVisible('hero') ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '400ms' }}>
                <Link href="/shop">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto gap-2 px-6 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/30 group"
                  >
                    <ShoppingBag className="h-4 w-4 md:h-5 md:w-5 group-hover:rotate-12 transition-transform" />
                    Shop Now
                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full sm:w-auto gap-2 px-6 border-white/30 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm hover:scale-105 transition-all duration-300"
                  >
                    <Eye className="h-4 w-4" />
                    Explore
                  </Button>
                </Link>
              </div>

              {/* Stats - Only show on desktop, mobile will show after hero */}
              <div className={`hidden md:flex gap-6 md:gap-8 pt-4 ${isSectionVisible('hero') ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '600ms' }}>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">10+</div>
                  <div className="text-sm text-white/60">Collections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">5k+</div>
                  <div className="text-sm text-white/60">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">24/7</div>
                  <div className="text-sm text-white/60">Support</div>
                </div>
              </div>
            </div>

            {/* Right Column - Hero Products Slider with animations */}
            <div className={`relative h-[400px] md:h-[550px] lg:h-[600px] ${isSectionVisible('hero') ? 'animate-slide-in-right' : 'opacity-0'}`}>
              {heroDisplayItems.length > 0 ? (
                <>
                  <div className="relative w-full h-full">
                    {heroDisplayItems.map((product, index) => (
                      <div
                        key={product.id}
                        className={`absolute top-0 left-0 w-full h-full transition-all duration-700 ease-in-out ${
                          index === currentHeroIndex
                            ? 'opacity-100 scale-100 translate-x-0 z-10'
                            : index < currentHeroIndex
                            ? 'opacity-0 -translate-x-full scale-95 z-0'
                            : 'opacity-0 translate-x-full scale-95 z-0'
                        }`}
                      >
                        <Card 
                          className="overflow-hidden rounded-3xl border-2 border-white/20 bg-black/20 backdrop-blur-xl shadow-2xl h-full cursor-pointer group"
                          onClick={() => isMobile && setShowMobileDetails(!showMobileDetails)}
                        >
                          <div className="w-full h-full relative">
                            {/* Product Image */}
                            <div className="absolute inset-0 bg-neutral-800">
                              <img 
                                src={getProductImage(product)} 
                                alt={product.name}
                                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            
                            {/* Content Overlay */}
                            <div className={`absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black via-black/40 to-transparent transition-all duration-300 ${
                              isMobile && !showMobileDetails ? 'h-24' : 'h-auto pb-16 md:pb-20'
                            }`}>
                              <div className="text-center space-y-2">
                                <h3 className="text-white font-bold text-xl md:text-2xl group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-rose-500 group-hover:bg-clip-text transition-all duration-300">
                                  {product.name}
                                </h3>
                                
                                {/* On mobile, hide price and button until tapped */}
                                <div className={`${isMobile && !showMobileDetails ? 'hidden' : 'block'} ${isSectionVisible('hero') ? 'animate-fade-in' : 'opacity-0'}`}>
                                  <div className="text-amber-300 text-xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                                    {formatPriceKES(product.price)}
                                  </div>
                                  <Link href={`/product/${product.id}`}>
                                    <Button className="bg-white text-black hover:bg-amber-500 hover:text-white hover:scale-105 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-amber-500/30">
                                      View Details
                                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                  </Link>
                                </div>
                                
                                {isMobile && !showMobileDetails && (
                                  <p className="text-white/50 text-xs italic animate-pulse">Tap to view details</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>

                  {/* Navigation Arrows */}
                  <button 
                    onClick={prevHeroProduct} 
                    className="absolute left-[-10px] md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center z-40 hover:bg-white/20 hover:scale-110 transition-all duration-300 group"
                  >
                    <ChevronLeft className="h-6 w-6 text-white group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={nextHeroProduct} 
                    className="absolute right-[-10px] md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center z-40 hover:bg-white/20 hover:scale-110 transition-all duration-300 group"
                  >
                    <ChevronRight className="h-6 w-6 text-white group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-40">
                    {heroDisplayItems.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToHeroProduct(index)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          index === currentHeroIndex 
                            ? 'bg-gradient-to-r from-amber-500 to-rose-500 w-8' 
                            : 'bg-white/30 w-2 hover:bg-white/50 hover:scale-110'
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className={`h-full w-full flex items-center justify-center border-2 border-dashed border-white/20 rounded-3xl ${isSectionVisible('hero') ? 'animate-pulse' : ''}`}>
                  <Skeleton className="w-full h-full rounded-3xl" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce opacity-50 z-30">
          <div className="w-5 h-8 border-2 border-white rounded-full flex justify-center pt-1">
            <div className="w-1 h-2 bg-white rounded-full animate-scroll" />
          </div>
        </div>
      </section>

      {/* Mobile Stats Section - Only shows on mobile */}
      {isMobile && (
        <section className="py-8 bg-gradient-to-b from-gray-900 to-gray-800 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex justify-around gap-6 animate-fade-in">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">10+</div>
                <div className="text-sm text-white/60">Collections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">5k+</div>
                <div className="text-sm text-white/60">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-white/60">Support</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section with animations */}
      <section 
        id="features" 
        ref={(el) => { sectionRefs.current['features'] = el; }} 
        className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900"
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-12">
            <h2 className={`font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4 ${isSectionVisible('features') ? 'animate-fade-in' : 'opacity-0'}`}>
              Why Choose{" "}
              <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">
                JEWEL HAVEN
              </span>
            </h2>
            <p className={`text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto ${isSectionVisible('features') ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              Experience luxury shopping with premium benefits designed just for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group relative ${isSectionVisible('features') ? 'animate-fade-up' : 'opacity-0'}`}
                style={{ 
                  animationDelay: isSectionVisible('features') ? feature.delay : '0ms',
                }}
              >
                {/* Hover Effect Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                
                <Card className="relative overflow-hidden border-2 border-transparent group-hover:border-white/20 dark:group-hover:border-gray-700 transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl md:group-hover:shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
                  <CardContent className="p-6 md:p-8 text-center space-y-4 md:space-y-6">
                    <div className={`inline-flex p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-r ${feature.gradient} group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg`}>
                      <feature.icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    
                    <div className="space-y-2 md:space-y-3">
                      <h3 className="font-bold text-lg md:text-xl text-foreground group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-rose-500 group-hover:bg-clip-text transition-all duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>

                    {/* Animated Check */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-emerald-500 mx-auto animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section with animations */}
      <section 
        id="featured-products" 
        ref={(el) => { sectionRefs.current['featured-products'] = el; }} 
        className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900"
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className={isSectionVisible('featured-products') ? 'animate-slide-in-left' : 'opacity-0'}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-rose-500/10 mb-2 md:mb-3">
                <Star className="h-3 w-3 md:h-4 md:w-4 text-amber-500 animate-spin-slow" />
                <span className="text-xs md:text-sm font-medium text-foreground">Editor's Pick</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-1 md:mb-2">
                Featured{" "}
                <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">
                  Masterpieces
                </span>
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                Handpicked luxury pieces that define elegance
              </p>
            </div>
            <Link href="/shop?featured=true">
              <Button 
                variant="outline" 
                className={`hidden sm:flex gap-2 ${isSectionVisible('featured-products') ? 'animate-fade-in' : 'opacity-0'} group`}
              >
                View All
                <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </div>
          
          {loadingFeatured ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <Skeleton className="aspect-[3/4] rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts?.slice(0, 4).map((product, index) => (
                <div 
                  key={product.id} 
                  className={isSectionVisible('featured-products') ? 'animate-fade-up' : 'opacity-0'}
                  style={{ 
                    animationDelay: isSectionVisible('featured-products') ? `${index * 100}ms` : '0ms',
                  }}
                >
                  <ProductCard 
                    product={product} 
                    priceFormatter={formatPriceKES}
                    className="group hover:scale-105 hover:shadow-xl md:hover:shadow-2xl transition-all duration-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section with animations */}
      <section 
        id="categories" 
        ref={(el) => { sectionRefs.current['categories'] = el; }} 
        className="py-12 md:py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950"
      >
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className={`font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4 ${isSectionVisible('categories') ? 'animate-fade-in' : 'opacity-0'}`}>
            Explore Our{" "}
            <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">
              Collections
            </span>
          </h2>
          <p className={`text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto ${isSectionVisible('categories') ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
            Find your perfect piece from our carefully curated categories
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mt-8">
            {categories.map((cat, index) => (
              <Link key={cat.name} href={cat.href}>
                <div 
                  className={`
                    group relative overflow-hidden cursor-pointer
                    ${isSectionVisible('categories') ? 'animate-fade-up' : 'opacity-0'}
                  `}
                  style={{ 
                    animationDelay: isSectionVisible('categories') ? `${index * 100}ms` : '0ms',
                  }}
                >
                  {/* Gradient Border Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg md:rounded-xl" />
                  
                  <Card className="relative bg-white dark:bg-gray-900 m-0.5 rounded-lg md:rounded-xl border-2 border-transparent group-hover:border-gradient hover:shadow-xl md:hover:shadow-2xl transition-all duration-500 hover:scale-105">
                    <CardContent className="p-4 md:p-6 lg:p-8 text-center space-y-4 md:space-y-6">
                      {/* Floating Emoji */}
                      <div className={`text-3xl md:text-4xl mb-1 md:mb-2 group-hover:scale-125 group-hover:-translate-y-1 md:group-hover:-translate-y-2 transition-all duration-500 ${cat.emoji === '💍' ? 'rotate-45 group-hover:rotate-0' : ''}`}>
                        {cat.emoji}
                      </div>
                      
                      {/* Animated Gradient Circle */}
                      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-r ${cat.gradient} rounded-full opacity-0 group-hover:opacity-5 blur-xl transition-opacity duration-700`} />
                      
                      <div className="space-y-2 md:space-y-3 relative z-10">
                        <h3 className="font-bold text-lg md:text-xl text-foreground group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-rose-500 group-hover:bg-clip-text transition-all duration-300">
                          {cat.name}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                          Explore collection
                        </p>
                      </div>

                      {/* Animated Arrow */}
                      <ArrowRight className="h-4 w-4 md:h-5 md:w-5 mx-auto text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-2 transition-all duration-300 opacity-0 group-hover:opacity-100" />
                    </CardContent>
                  </Card>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section with animations */}
      <section 
        id="new-arrivals" 
        ref={(el) => { sectionRefs.current['new-arrivals'] = el; }} 
        className="py-12 md:py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-rose-500/5 to-purple-500/5" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className={isSectionVisible('new-arrivals') ? 'animate-slide-in-left' : 'opacity-0'}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 mb-2 md:mb-3">
                <Zap className="h-3 w-3 md:h-4 md:w-4 text-cyan-500 animate-pulse" />
                <span className="text-xs md:text-sm font-medium text-foreground">Just Arrived</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-1 md:mb-2">
                New{" "}
                <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                  Arrivals
                </span>
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                Fresh from our workshop to your collection
              </p>
            </div>
            <Link href="/shop?sort=newest">
              <Button 
                variant="outline" 
                className={`hidden sm:flex gap-2 ${isSectionVisible('new-arrivals') ? 'animate-fade-in' : 'opacity-0'} group`}
              >
                View All
                <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {loadingLatest ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <Skeleton className="aspect-[3/4] rounded-xl" />
                </div>
              ))
            ) : latestProducts && latestProducts.length > 0 ? (
              latestProducts.slice(0, 4).map((product, index) => (
                <div 
                  key={product.id} 
                  className={isSectionVisible('new-arrivals') ? 'animate-fade-up' : 'opacity-0'}
                  style={{ 
                    animationDelay: isSectionVisible('new-arrivals') ? `${index * 100}ms` : '0ms',
                  }}
                >
                  <ProductCard 
                    product={product} 
                    priceFormatter={formatPriceKES} 
                    showNewBadge
                    className="group hover:scale-105 hover:shadow-xl md:hover:shadow-2xl transition-all duration-500 border-0 shadow-lg"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center py-8">
                <p className="text-muted-foreground">No products available yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}