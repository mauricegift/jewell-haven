import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Package, Loader2, Sparkles, Gem, Star, Crown, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Predefined categories with their configurations
const predefinedCategories = [
  {
    id: "rings",
    name: "Rings",
    description: "Beautiful rings for all fingers",
    icon: "💍",
    color: "from-blue-500 to-cyan-500",
    link: "/shop?category=rings"
  },
  {
    id: "necklaces",
    name: "Necklaces",
    description: "Elegant necklaces for every occasion",
    icon: "📿",
    color: "from-purple-500 to-pink-500",
    link: "/shop?category=necklaces"
  },
  {
    id: "earrings",
    name: "Earrings",
    description: "Stunning earrings to light up your face",
    icon: "✨",
    color: "from-green-500 to-emerald-500",
    link: "/shop?category=earrings"
  },
  {
    id: "bracelets",
    name: "Bracelets",
    description: "Charming bracelets for your wrist",
    icon: "📿",
    color: "from-yellow-500 to-orange-500",
    link: "/shop?category=bracelets"
  },
  {
    id: "watches",
    name: "Watches",
    description: "Luxury timepieces",
    icon: "⌚",
    color: "from-gray-500 to-slate-500",
    link: "/shop?category=watches"
  },
  {
    id: "pendants",
    name: "Pendants",
    description: "Beautiful pendant necklaces",
    icon: "✨",
    color: "from-red-500 to-rose-500",
    link: "/shop?category=pendants"
  }
];

// Special categories that are not in the database but handled differently
const specialCategories = [
  {
    id: "featured",
    name: "Featured Products",
    description: "Customer favorites and special collections",
    icon: "⭐",
    color: "from-emerald-500 to-green-500",
    link: "/shop?featured=true"
  },
  {
    id: "new",
    name: "New Arrivals",
    description: "Latest additions to our collection",
    icon: "🆕",
    color: "from-cyan-500 to-teal-500",
    link: "/shop?sort=newest"
  }
];

// Function to get category configuration
const getCategoryConfig = (categoryId: string) => {
  const found = predefinedCategories.find(cat => cat.id === categoryId);
  if (found) return found;
  
  return {
    name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
    description: `Explore our beautiful ${categoryId} collection`,
    icon: "💎",
    color: "from-gray-500 to-slate-500",
    link: `/shop?category=${categoryId}`
  };
};

interface CategoryStats {
  category: string;
  count: number;
}

export default function Categories() {
  // Fetch all products to get category counts
  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products", { limit: 1000, page: 1 }],
  });

  // Calculate category statistics from products
  const calculateCategoryStats = (): CategoryStats[] => {
    if (!productsResponse || !productsResponse.products) return [];
    
    const products = productsResponse.products;
    const categoryCounts: Record<string, number> = {};
    
    // Count products per category
    products.forEach((product: any) => {
      if (product && product.category) {
        const category = product.category.toLowerCase();
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
    
    // Convert to array and sort by count descending
    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  };

  const categoryStats = calculateCategoryStats();

  // Create categories with product counts
  const getCategoriesWithCounts = () => {
    const allCategories = [];
    
    // Add predefined categories with their counts
    const predefinedWithCounts = predefinedCategories.map(cat => {
      const stats = categoryStats.find(stat => stat.category === cat.id);
      return {
        ...cat,
        count: stats?.count || 0
      };
    });
    
    // Add special categories
    const featuredCount = productsResponse?.products?.filter((p: any) => p?.featured).length || 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newArrivalsCount = productsResponse?.products?.filter((p: any) => 
      p?.createdAt && new Date(p.createdAt) > thirtyDaysAgo
    ).length || 0;
    
    const specialWithCounts = specialCategories.map(cat => ({
      ...cat,
      count: cat.id === 'featured' ? featuredCount : cat.id === 'new' ? newArrivalsCount : 0
    }));
    
    // Add other categories from database that aren't predefined
    const otherCategories = categoryStats
      .filter(stat => !predefinedCategories.find(cat => cat.id === stat.category))
      .map(stat => {
        const config = getCategoryConfig(stat.category);
        return {
          id: stat.category,
          name: config.name,
          description: config.description,
          icon: config.icon,
          color: config.color,
          link: config.link,
          count: stat.count
        };
      });
    
    return [...predefinedWithCounts, ...specialWithCounts, ...otherCategories];
  };

  const categories = getCategoriesWithCounts();
  
  // Filter to show only categories with products, or featured/new even if 0
  const displayCategories = categories.filter(cat => 
    cat.count > 0 || cat.id === 'featured' || cat.id === 'new'
  );

  // Loading skeleton
  if (productsLoading) {
    return (
      <div className="min-h-screen py-8 bg-gradient-to-b from-amber-50/10 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4 bg-gradient-to-r from-amber-200 to-yellow-200 dark:from-amber-800/30 dark:to-yellow-800/30" />
            <Skeleton className="h-6 w-96 mx-auto bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="h-full border-amber-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-14 w-14 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20" />
                    <Skeleton className="h-6 w-16 bg-gradient-to-r from-amber-200 to-yellow-200 dark:from-amber-800/30 dark:to-yellow-800/30" />
                  </div>
                  <Skeleton className="h-6 w-32 mt-4 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-4 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20" />
                  <Skeleton className="h-10 w-full bg-gradient-to-r from-amber-200 to-yellow-200 dark:from-amber-800/30 dark:to-yellow-800/30" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalProducts = productsResponse?.total || 0;

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-amber-50/10 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 md:px-6">
        {/* Hero Section */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/5 to-transparent dark:via-amber-900/5"></div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 relative">
            <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              Our Collections
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto relative animate-fade-in">
            Explore our exquisite range of jewelry categories, each crafted with precision 
            and passion to bring out your unique beauty.
          </p>
        </div>

        {/* Categories Grid */}
        {displayCategories.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayCategories.map((category, idx) => (
                <Link key={category.id} href={category.link}>
                  <Card className="
                    group cursor-pointer h-full relative overflow-hidden 
                    border-2 border-transparent hover:border-amber-300 dark:hover:border-amber-700
                    transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-100/20
                    animate-fade-up bg-gradient-to-br ${category.color}/10
                  " style={{ animationDelay: `${idx * 100}ms` }}>
                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-amber-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full"></div>
                    
                    <CardHeader className="pb-2 relative">
                      <div className="flex items-center justify-between">
                        <div className={`
                          p-3 rounded-lg bg-gradient-to-br ${category.color} 
                          group-hover:scale-110 group-hover:rotate-6
                          transition-all duration-500 shadow-lg
                        `}>
                          <span className="text-2xl">{category.icon}</span>
                        </div>
                        <Badge className="
                          bg-gradient-to-r from-amber-500 to-yellow-500 text-white
                          group-hover:from-amber-600 group-hover:to-yellow-600
                          transition-all duration-300
                        ">
                          {category.count} {category.count === 1 ? 'item' : 'items'}
                        </Badge>
                      </div>
                      <CardTitle className="mt-4 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors duration-300">
                        {category.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                      <p className="text-sm text-muted-foreground mb-4 group-hover:text-foreground transition-colors duration-300">
                        {category.description}
                      </p>
                      <Button variant="ghost" className="
                        w-full group-hover:text-primary group-hover:bg-amber-50
                        transition-all duration-300 gap-2
                      ">
                        <span>Browse Collection</span>
                        <Sparkles className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Stats Summary */}
            <div className="mt-12 text-center animate-fade-up" style={{ animationDelay: '300ms' }}>
              <div className="
                inline-flex items-center gap-2 px-6 py-3 rounded-full 
                bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20
                border-2 border-amber-200 text-amber-700 text-sm font-medium shadow-lg
              ">
                <Package className="h-5 w-5" />
                <span>Total Products: {totalProducts}</span>
                <span className="mx-2">•</span>
                <span>Categories: {displayCategories.length}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20 flex items-center justify-center">
              <Gem className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Categories Available</h3>
            <p className="text-muted-foreground mb-6">
              There are no products categorized yet. Add products to see categories here.
            </p>
            <Link href="/admin/products">
              <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 transition-all duration-300">
                Add Products
              </Button>
            </Link>
          </div>
        )}

        {/* Featured Collections */}
        <div className="mt-20">
          <h2 className="font-serif text-3xl font-bold text-center mb-8 animate-fade-up">
            <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              Featured Collections
            </span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Link href="/shop?category=luxury">
              <Card className="
                bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-purple-100/20 
                dark:from-purple-950/30 dark:to-pink-950/30
                border-2 border-purple-200/50 dark:border-purple-800/30
                overflow-hidden group animate-fade-up cursor-pointer
                hover:border-purple-300 dark:hover:border-purple-600
                transition-all duration-300 hover:scale-[1.02]
              " style={{ animationDelay: '100ms' }}>
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-3xl"></div>
                </div>
                <CardContent className="p-8 relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="
                      p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500
                      group-hover:scale-110 transition-transform duration-500 shadow-lg
                    ">
                      <Crown className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl font-bold">Royal Collection</h3>
                      <p className="text-muted-foreground">Fit for royalty</p>
                    </div>
                  </div>
                  <p className="text-lg mb-6 text-foreground/80">
                    Our most exclusive line of jewelry, featuring rare gemstones and 
                    exceptional craftsmanship. Each piece tells a story of luxury and elegance.
                  </p>
                  <Button className="
                    bg-gradient-to-br from-purple-600 to-pink-600 
                    hover:from-purple-700 hover:to-pink-700
                    hover:shadow-xl hover:shadow-purple-200/50
                    transition-all duration-300 transform hover:-translate-y-1
                    gap-2
                  ">
                    <Crown className="h-5 w-5" />
                    Explore Royal Collection
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/shop?category=engagement">
              <Card className="
                bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-blue-100/20 
                dark:from-blue-950/30 dark:to-cyan-950/30
                border-2 border-blue-200/50 dark:border-blue-800/30
                overflow-hidden group animate-fade-up cursor-pointer
                hover:border-blue-300 dark:hover:border-blue-600
                transition-all duration-300 hover:scale-[1.02]
              " style={{ animationDelay: '200ms' }}>
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full blur-3xl"></div>
                </div>
                <CardContent className="p-8 relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="
                      p-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500
                      group-hover:scale-110 transition-transform duration-500 shadow-lg
                    ">
                      <Heart className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl font-bold">Love Stories</h3>
                      <p className="text-muted-foreground">Symbols of eternal love</p>
                    </div>
                  </div>
                  <p className="text-lg mb-6 text-foreground/80">
                    Celebrate love with our engagement and wedding collections. 
                    Timeless designs that capture the essence of your special moments.
                  </p>
                  <Button className="
                    bg-gradient-to-br from-blue-600 to-cyan-600 
                    hover:from-blue-700 hover:to-cyan-700
                    hover:shadow-xl hover:shadow-blue-200/50
                    transition-all duration-300 transform hover:-translate-y-1
                    gap-2
                  ">
                    <Heart className="h-5 w-5" />
                    Explore Love Collection
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center animate-fade-up" style={{ animationDelay: '400ms' }}>
          <Card className="
            bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-amber-100/20 
            dark:from-amber-900/20 dark:via-yellow-900/10 dark:to-amber-900/20
            border-2 border-amber-200/50 dark:border-amber-800/30
            overflow-hidden
          ">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-3xl"></div>
            </div>
            
            <CardContent className="py-12 relative">
              <div className="p-4 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20 inline-block mb-6">
                <Star className="h-12 w-12 text-amber-600 dark:text-amber-400 animate-float" />
              </div>
              <h2 className="font-serif text-3xl font-bold mb-4">
                <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                  Can't Find What You're Looking For?
                </span>
              </h2>
              <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
                Our expert jewelers can create custom pieces just for you. 
                Contact us for bespoke jewelry design services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-pop-in">
                <Link href="/contact">
                  <Button 
                    size="lg" 
                    className="
                      bg-gradient-to-r from-amber-500 to-yellow-500 
                      hover:from-amber-600 hover:to-yellow-600
                      hover:shadow-2xl hover:shadow-amber-200/50
                      transition-all duration-300 transform hover:-translate-y-1
                      gap-2
                    "
                  >
                    <Gem className="h-5 w-5" />
                    Contact Us
                  </Button>
                </Link>
                <Link href="/services">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="
                      border-amber-300 text-amber-700 hover:bg-amber-50 
                      hover:border-amber-400 hover:text-amber-800
                      transition-all duration-300 transform hover:-translate-y-1
                      gap-2
                    "
                  >
                    <Sparkles className="h-5 w-5" />
                    Our Services
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}