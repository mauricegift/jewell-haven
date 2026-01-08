import { useState, useEffect } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Sparkles, Filter, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@shared/schema";

const ITEMS_PER_PAGE = 12;

const categories = [
  { value: "all", label: "All Categories", icon: "✨", color: "from-amber-500 to-yellow-500" },
  { value: "rings", label: "Rings", icon: "💍", color: "from-purple-500 to-pink-500" },
  { value: "necklaces", label: "Necklaces", icon: "📿", color: "from-blue-500 to-cyan-500" },
  { value: "earrings", label: "Earrings", icon: "💎", color: "from-emerald-500 to-green-500" },
  { value: "bracelets", label: "Bracelets", icon: "📿", color: "from-yellow-500 to-orange-500" },
  { value: "watches", label: "Watches", icon: "⌚", color: "from-gray-500 to-slate-500" },
  { value: "pendants", label: "Pendants", icon: "✨", color: "from-rose-500 to-red-500" },
];

const priceRanges = [
  { value: "all", label: "All Prices", color: "from-amber-500 to-yellow-500" },
  { value: "0-5000", label: "Under KSh 5,000", color: "from-emerald-500 to-green-500" },
  { value: "5000-10000", label: "KSh 5,000 - 10,000", color: "from-blue-500 to-cyan-500" },
  { value: "10000-25000", label: "KSh 10,000 - 25,000", color: "from-purple-500 to-pink-500" },
  { value: "25000-50000", label: "KSh 25,000 - 50,000", color: "from-rose-500 to-red-500" },
  { value: "50000+", label: "Over KSh 50,000", color: "from-amber-600 to-yellow-600" },
];

const sortOptions = [
  { value: "newest", label: "Newest First", icon: "🆕" },
  { value: "price-asc", label: "Price: Low to High", icon: "⬆️" },
  { value: "price-desc", label: "Price: High to Low", icon: "⬇️" },
  { value: "name-asc", label: "Name: A to Z", icon: "🔤" },
  { value: "featured", label: "Featured First", icon: "⭐" },
];

export default function Shop() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(searchString);

  const [searchQuery, setSearchQuery] = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "all");
  const [priceRange, setPriceRange] = useState(params.get("price") || "all");
  const [sort, setSort] = useState(params.get("sort") || "newest");
  const [currentPage, setCurrentPage] = useState(parseInt(params.get("page") || "1"));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [animateProduct, setAnimateProduct] = useState<number | null>(null);

  const { data: productsData, isLoading } = useQuery<{
    products: Product[];
    total: number;
    totalPages: number;
  }>({
    queryKey: ["/api/products", { search: searchQuery, category, price: priceRange, sort, page: currentPage, limit: ITEMS_PER_PAGE }],
  });

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;
  const total = productsData?.total || 0;

  useEffect(() => {
    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set("search", searchQuery);
    if (category !== "all") newParams.set("category", category);
    if (priceRange !== "all") newParams.set("price", priceRange);
    if (sort !== "newest") newParams.set("sort", sort);
    if (currentPage > 1) newParams.set("page", currentPage.toString());
    
    const queryString = newParams.toString();
    setLocation(`/shop${queryString ? `?${queryString}` : ""}`, { replace: true });
  }, [searchQuery, category, priceRange, sort, currentPage, setLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 1000);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategory("all");
    setPriceRange("all");
    setSort("newest");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || category !== "all" || priceRange !== "all";

  const Pagination = () => (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        data-testid="button-prev-page"
        className="border-amber-200 hover:bg-amber-50 hover:border-amber-300 hover:scale-105 transition-all duration-200"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">Previous</span>
      </Button>
      
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(pageNum)}
              className={`
                w-9 transition-all duration-200
                ${currentPage === pageNum 
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600" 
                  : "border-amber-200 hover:bg-amber-50 hover:border-amber-300 hover:scale-105"
                }
              `}
              data-testid={`button-page-${pageNum}`}
            >
              {pageNum}
            </Button>
          );
        })}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        data-testid="button-next-page"
        className="border-amber-200 hover:bg-amber-50 hover:border-amber-300 hover:scale-105 transition-all duration-200"
      >
        <span className="hidden sm:inline mr-1">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const FilterContent = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Category
        </label>
        <Select value={category} onValueChange={(v) => { setCategory(v); setCurrentPage(1); }}>
          <SelectTrigger data-testid="select-category" className="border-amber-200 focus:ring-amber-500">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-900 border-amber-200">
            {categories.map((cat) => (
              <SelectItem 
                key={cat.value} 
                value={cat.value}
                className="hover:bg-amber-50 dark:hover:bg-amber-900/20 focus:bg-amber-50 dark:focus:bg-amber-900/20"
              >
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  {cat.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Price Range
        </label>
        <Select value={priceRange} onValueChange={(v) => { setPriceRange(v); setCurrentPage(1); }}>
          <SelectTrigger data-testid="select-price" className="border-amber-200 focus:ring-amber-500">
            <SelectValue placeholder="Select price range" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-900 border-amber-200">
            {priceRanges.map((range) => (
              <SelectItem 
                key={range.value} 
                value={range.value}
                className="hover:bg-amber-50 dark:hover:bg-amber-900/20 focus:bg-amber-50 dark:focus:bg-amber-900/20"
              >
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Sort By
        </label>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger data-testid="select-sort" className="border-amber-200 focus:ring-amber-500">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-900 border-amber-200">
            {sortOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="hover:bg-amber-50 dark:hover:bg-amber-900/20 focus:bg-amber-50 dark:focus:bg-amber-900/20"
              >
                <span className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-800 transition-all duration-300"
          onClick={clearFilters}
          data-testid="button-clear-filters"
        >
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen py-6 md:py-8 bg-gradient-to-b from-amber-50/10 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/5 to-transparent dark:via-amber-900/5 animate-pulse"></div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-3 relative">
            <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent animate-gradient">
              Shop Jewelry
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover our collection of beautiful jewelry pieces, each crafted with passion and precision
          </p>
          {isSearching && (
            <div className="absolute -top-2 -right-2">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500 rounded-full blur-lg opacity-75 animate-ping"></div>
                <Sparkles className="h-6 w-6 text-amber-500 relative animate-spin" />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card className="sticky top-24 border-2 border-amber-200/50 dark:border-amber-800/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-50/20 to-transparent dark:from-amber-900/5"></div>
              <CardContent className="p-6 relative">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  <SlidersHorizontal className="h-5 w-5 text-amber-600" />
                  Filters
                </h3>
                <FilterContent />
              </CardContent>
            </Card>
          </aside>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400 group-hover:text-amber-500 transition-colors duration-300" />
                  <Input
                    type="search"
                    placeholder="Search for exquisite jewelry..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="
                      pl-12 pr-12 h-12 text-lg
                      border-2 border-amber-200 focus:border-amber-400 focus:ring-amber-400
                      transition-all duration-300 group-hover:shadow-lg group-hover:shadow-amber-100/50
                      bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm
                    "
                    data-testid="input-search"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-5 w-5 text-amber-400 hover:text-amber-600 transition-colors duration-200" />
                    </button>
                  )}
                </div>
              </form>
              
              <div className="flex gap-2">
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="lg:hidden gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-800 hover:scale-105 transition-all duration-200"
                      data-testid="button-filters-mobile"
                    >
                      <SlidersHorizontal className="h-5 w-5" />
                      Filters
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white animate-pulse">
                          Active
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="border-l-2 border-amber-200">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <SlidersHorizontal className="h-6 w-6 text-amber-600" />
                        Filters
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>
                
                <div className="hidden sm:block lg:hidden">
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-[180px] border-amber-200 focus:ring-amber-500">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-amber-200">
                      {sortOptions.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className="hover:bg-amber-50 dark:hover:bg-amber-900/20 focus:bg-amber-50 dark:focus:bg-amber-900/20"
                        >
                          <span className="flex items-center gap-2">
                            <span>{option.icon}</span>
                            {option.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-6 animate-fade-in">
                {searchQuery && (
                  <Badge 
                    variant="secondary" 
                    className="gap-1 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 text-amber-700"
                  >
                    Search: {searchQuery}
                    <button 
                      onClick={() => setSearchQuery("")} 
                      className="ml-1 hover:scale-125 transition-transform duration-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {category !== "all" && (
                  <Badge 
                    variant="secondary" 
                    className="gap-1 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 text-purple-700"
                  >
                    {categories.find((c) => c.value === category)?.label}
                    <button 
                      onClick={() => setCategory("all")} 
                      className="ml-1 hover:scale-125 transition-transform duration-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {priceRange !== "all" && (
                  <Badge 
                    variant="secondary" 
                    className="gap-1 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 text-emerald-700"
                  >
                    {priceRanges.find((p) => p.value === priceRange)?.label}
                    <button 
                      onClick={() => setPriceRange("all")} 
                      className="ml-1 hover:scale-125 transition-transform duration-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                >
                  Clear All
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between mb-6 p-4 rounded-lg bg-gradient-to-r from-amber-50/50 to-yellow-50/30 dark:from-amber-900/10 dark:to-yellow-900/10 border border-amber-200/50">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <span className="font-semibold">Showing {products.length} of {total} products</span>
                {products.length > 0 && (
                  <span className="ml-4 text-xs">
                    {products.filter(p => p.stockQuantity > 0).length} in stock • 
                    {products.filter(p => p.stockQuantity === 0).length} out of stock
                  </span>
                )}
              </p>
              {totalPages > 1 && <Pagination />}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card 
                    key={i} 
                    className="overflow-hidden border-amber-200 animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <Skeleton className="aspect-square bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-20 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20" />
                      <Skeleton className="h-5 w-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20" />
                      <Skeleton className="h-6 w-24 bg-gradient-to-r from-amber-200 to-yellow-200 dark:from-amber-800/30 dark:to-yellow-800/30" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((product, idx) => (
                  <div 
                    key={product.id} 
                    className="animate-fade-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onMouseEnter={() => setAnimateProduct(idx)}
                    onMouseLeave={() => setAnimateProduct(null)}
                  >
                    <ProductCard 
                      product={product} 
                      className={`
                        transition-all duration-500
                        ${animateProduct === idx 
                          ? 'transform scale-105 shadow-2xl shadow-amber-200/30 border-amber-300' 
                          : 'hover:scale-102 hover:shadow-xl hover:shadow-amber-100/20 hover:border-amber-200'
                        }
                      `}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center border-2 border-amber-200 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20 animate-fade-in shadow-lg shadow-amber-200/20">
                <div className="p-4 rounded-full bg-gradient-to-br from-amber-200 to-yellow-200 dark:from-amber-800/40 dark:to-yellow-800/30 inline-block mb-6 shadow-lg">
                  <Sparkles className="h-12 w-12 text-amber-700 dark:text-amber-300" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-amber-800 dark:text-amber-200">
                  No products found
                </h3>
                <p className="text-amber-700/80 dark:text-amber-300/80 mb-8 text-lg">
                  Try adjusting your filters or search term
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-8 py-6 text-base font-medium shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Clear Filters
                  </Button>
                  <Link href="/shop?category=featured">
                    <Button 
                      variant="outline" 
                      className="border-2 border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 hover:border-amber-500 hover:text-amber-800 px-8 py-6 text-base font-medium transition-all duration-300"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      View Featured
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="animate-fade-in">
                  <Pagination />
                </div>
              </div>
            )}

            {/* Quick Categories */}
            <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-amber-100/20 dark:from-amber-900/10 dark:via-yellow-900/5 dark:to-amber-900/20 border border-amber-200/50">
              <h3 className="font-semibold text-lg mb-4 text-amber-800 dark:text-amber-300">
                Quick Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.slice(1, 5).map((cat) => (
                  <Link key={cat.value} href={`/shop?category=${cat.value}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`
                        border-amber-200 hover:border-amber-300 
                        hover:bg-gradient-to-r ${cat.color}/10 hover:text-foreground
                        transition-all duration-300 hover:scale-105
                        ${category === cat.value ? `bg-gradient-to-r ${cat.color}/20 border-amber-400` : ''}
                      `}
                    >
                      <span className="mr-2">{cat.icon}</span>
                      {cat.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}