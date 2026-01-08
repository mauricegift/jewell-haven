import { Link } from "wouter";
import { ShoppingBag, Heart, Eye, Star, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Product } from "@shared/schema";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface ProductCardProps {
  product: Product;
  showQuickView?: boolean;
}

export function ProductCard({ product, showQuickView = true }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [rating] = useState(() => Math.random() * 2 + 3); // Random rating between 3-5
  const [reviewCount] = useState(() => Math.floor(Math.random() * 100) + 5); // Random reviews 5-104

  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  const discountPercent = hasDiscount
    ? Math.round(
        ((parseFloat(product.originalPrice!) - parseFloat(product.price)) /
          parseFloat(product.originalPrice!)) *
          100
      )
    : 0;

  // Use actual stockQuantity from API instead of inStock boolean
  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const stockPercentage = product.stockQuantity > 0 
    ? Math.min(100, (product.stockQuantity / 50) * 100) 
    : 0; // Cap at 100% for visual representation

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock) {
      toast({
        title: "⚠️ Out of Stock",
        description: `${product.name} is currently out of stock.`,
        duration: 2000,
        variant: "destructive"
      });
      return;
    }
    
    if (isLowStock) {
      toast({
        title: "⚠️ Low Stock Alert",
        description: `Only ${product.stockQuantity} item(s) left in stock!`,
        duration: 2500,
      });
    }
    
    addToCart(product, 1);
    toast({
      title: "🎉 Added to cart!",
      description: `${product.name} has been added to your cart.`,
      duration: 2000,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "❤️ Removed from wishlist" : "💖 Added to wishlist",
      description: isWishlisted 
        ? `${product.name} removed from your wishlist.`
        : `${product.name} added to your wishlist.`,
      duration: 1500,
    });
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // You can implement a quick view modal here
    console.log("Quick view for:", product.id);
  };

  // Simulate trending status
  const isTrending = Math.random() > 0.7;
  const isBestSeller = Math.random() > 0.8;

  return (
    <TooltipProvider>
      <Card 
        className="group relative overflow-visible border-card-border bg-card hover:shadow-2xl hover:shadow-primary/5 active:shadow-lg transition-all duration-300 hover:-translate-y-1 active:translate-y-0 hover:border-primary/20"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        data-testid={`card-product-${product.id}`}
      >
        <Link href={`/product/${product.id}`} className="block">
          <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 to-background">
            {/* Image with gradient overlay on hover */}
            <div className="relative h-full w-full overflow-hidden">
              {product.image ? (
                <>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground bg-gradient-to-br from-muted to-background">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <ShoppingBag className="h-6 w-6 text-primary/50" />
                    </div>
                    <p className="text-sm">No Image</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Badges Container */}
            <div className="absolute top-2 left-2 flex flex-col gap-2">
              {hasDiscount && (
                <Badge
                  variant="destructive"
                  className="text-xs font-bold py-1 px-3 animate-pulse shadow-lg"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  -{discountPercent}% OFF
                </Badge>
              )}
              
              {isTrending && !hasDiscount && (
                <Badge
                  variant="default"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold py-1 px-3 shadow-lg"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  TRENDING
                </Badge>
              )}
              
              {isBestSeller && (
                <Badge
                  variant="default"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold py-1 px-3 shadow-lg"
                >
                  <Star className="h-3 w-3 mr-1" />
                  BEST SELLER
                </Badge>
              )}
              
              {/* Stock Badge */}
              {isOutOfStock && (
                <Badge
                  variant="secondary"
                  className="bg-red-500 text-white text-xs font-bold py-1 px-3 shadow-lg"
                >
                  OUT OF STOCK
                </Badge>
              )}
              
              {isLowStock && !isOutOfStock && (
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold py-1 px-3 shadow-lg animate-pulse"
                >
                  LOW STOCK
                </Badge>
              )}
            </div>

            {isOutOfStock && (
              <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                <Badge variant="secondary" className="text-sm py-2 px-4 border border-red-300 bg-red-50 text-red-700">
                  Out of Stock
                </Badge>
              </div>
            )}

            {/* Action Buttons - Appear on hover */}
            <div className={`absolute top-2 right-2 flex flex-col gap-2 transition-all duration-300 ${
              isHovering ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            }`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className={`h-10 w-10 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
                      isWishlisted 
                        ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' 
                        : 'bg-white/90 backdrop-blur-sm hover:bg-white'
                    }`}
                    onClick={handleToggleWishlist}
                    data-testid={`button-wishlist-${product.id}`}
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}</p>
                </TooltipContent>
              </Tooltip>

              {showQuickView && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-10 w-10 rounded-full shadow-lg bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:scale-110"
                      onClick={handleQuickView}
                      data-testid={`button-quickview-${product.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Quick View</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Add to Cart Button overlay - Appears on image hover */}
            {!isOutOfStock && (
              <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 via-background/50 to-transparent transition-all duration-300 ${
                isHovering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <Button
                  size="sm"
                  className={`w-full gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-100 ${
                    isLowStock
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                      : 'bg-primary hover:bg-primary/90 text-white'
                  }`}
                  onClick={handleAddToCart}
                  data-testid={`button-add-to-cart-${product.id}`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {isLowStock ? `Buy Now (${product.stockQuantity} left)` : 'Add to Cart'}
                </Button>
              </div>
            )}
          </div>

          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline" 
                  className="text-[10px] font-normal px-2 py-0.5 hover:bg-primary/10 transition-colors"
                >
                  {product.category}
                </Badge>
                
                {/* Rating */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(rating)
                            ? 'fill-amber-500 text-amber-500'
                            : 'fill-muted text-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">({reviewCount})</span>
                </div>
              </div>
              
              <h3 className="font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200 min-h-[2.5rem]">
                {product.name}
              </h3>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-primary">
                    KSh {parseFloat(product.price).toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-muted-foreground line-through">
                      KSh {parseFloat(product.originalPrice!).toLocaleString()}
                    </span>
                  )}
                </div>
                
                {/* Savings display */}
                {hasDiscount && (
                  <span className="text-xs text-green-600 font-medium mt-1">
                    Save KSh {(parseFloat(product.originalPrice!) - parseFloat(product.price)).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Stock indicator - Using actual stockQuantity */}
              {!isOutOfStock && (
                <div className="text-right">
                  <div className={`text-xs font-medium ${
                    isLowStock 
                      ? 'text-orange-600 animate-pulse' 
                      : 'text-green-600'
                  }`}>
                    {product.stockQuantity} in stock
                  </div>
                  <div className="w-16 h-1 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full rounded-full ${
                        isLowStock 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                          : 'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`} 
                      style={{ width: `${stockPercentage}%` }}
                    />
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 -mt-1" />
                  </div>
                </div>
              )}
              
              {isOutOfStock && (
                <div className="text-right">
                  <div className="text-xs text-red-600 font-medium">
                    Out of stock
                  </div>
                  <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1" />
                </div>
              )}
            </div>

            {/* Fallback Add to Cart button for mobile/touch devices */}
            {!isOutOfStock && (
              <Button
                size="sm"
                variant={isLowStock ? "destructive" : "outline"}
                className={`w-full gap-2 mt-2 lg:hidden ${
                  isLowStock
                    ? 'border-red-300 hover:border-red-400 hover:bg-red-50'
                    : 'border-primary/20 hover:border-primary hover:bg-primary/5'
                }`}
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-4 w-4" />
                {isLowStock ? `Buy Now (${product.stockQuantity} left)` : 'Add to Cart'}
              </Button>
            )}
            
            {isOutOfStock && (
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2 mt-2 lg:hidden border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50 cursor-not-allowed"
                disabled
              >
                <ShoppingBag className="h-4 w-4" />
                Out of Stock
              </Button>
            )}
          </CardContent>
        </Link>

        {/* Hover border effect */}
        <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-primary/10 transition-all duration-300 pointer-events-none" />
      </Card>
    </TooltipProvider>
  );
}