import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  Share2,
  Truck,
  RotateCcw,
  Shield,
  ChevronLeft,
  Minus,
  Plus,
  Check,
  Copy,
  Sparkles,
  Heart,
  Eye,
  ZoomIn,
  Star,
  Package,
  Gem,
  Clock,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@shared/schema";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isOutOfStock, setIsOutOfStock] = useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", id],
    enabled: !!id,
  });

  const { data: relatedProducts } = useQuery<Product[]>({
    queryKey: ["/api/products/related", id],
    enabled: !!id,
  });

  // Update out of stock status when product data changes
  useEffect(() => {
    if (product) {
      setIsOutOfStock(product.stockQuantity === 0);
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    addToCart(product, quantity);
    toast({
      title: "✨ Added to cart!",
      description: `${quantity}x "${product.name}" has been added to your cart.`,
      className: "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20",
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "📋 Link copied!",
        description: "Product link has been copied to clipboard.",
        className: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually from the address bar.",
        variant: "destructive",
      });
    }
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "❤️ Removed from wishlist" : "✨ Added to wishlist!",
      description: isWishlisted 
        ? "Product removed from your wishlist"
        : "Product added to your wishlist",
      className: "border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-6 md:py-8 bg-gradient-to-b from-amber-50/10 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div>
              <Skeleton className="aspect-square rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20" />
              <div className="flex gap-2 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20" />
              <Skeleton className="h-6 w-1/4 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20" />
              <Skeleton className="h-10 w-1/3 bg-gradient-to-r from-amber-200 to-yellow-200 dark:from-amber-800/30 dark:to-yellow-800/30" />
              <Skeleton className="h-32 w-full bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10" />
              <Skeleton className="h-12 w-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen py-6 md:py-8 flex items-center justify-center bg-gradient-to-b from-amber-50/10 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="p-4 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20 inline-block mb-6">
            <Gem className="h-12 w-12 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4 dark:text-white">Product Not Found</h1>
          <p className="text-muted-foreground mb-6 dark:text-gray-300">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/shop">
            <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 dark:from-amber-600 dark:to-yellow-600">
              Back to Shop
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasDiscount =
    product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  const discountPercent = hasDiscount
    ? Math.round(
        ((parseFloat(product.originalPrice!) - parseFloat(product.price)) /
          parseFloat(product.originalPrice!)) *
          100
      )
    : 0;

  const images = [product.image, ...(product.images || [])].filter(Boolean);
  const rating = product.rating || 4.5;
  const reviewCount = product.reviewCount || 42;

  return (
    <div className="min-h-screen py-6 md:py-8 bg-gradient-to-b from-amber-50/10 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 md:px-6">
        <Link href="/shop" className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-800 hover:gap-3 transition-all duration-300 mb-6 group dark:text-amber-400 dark:hover:text-amber-300">
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20 group">
              {images[selectedImage] ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className={`h-full w-full object-cover transition-all duration-500 ${isZoomed ? 'scale-110' : 'group-hover:scale-105'}`}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground dark:text-gray-400">
                  <Gem className="h-20 w-20 text-amber-300 dark:text-amber-600" />
                </div>
              )}
              
              {/* Top badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {hasDiscount && (
                  <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold shadow-lg animate-pulse">
                    -{discountPercent}% OFF
                  </Badge>
                )}
                {product.featured && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-semibold shadow-lg">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              
              {/* Action buttons - Fixed visibility */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="bg-white/90 backdrop-blur-sm hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setIsZoomed(!isZoomed)}
                  data-testid="button-zoom"
                >
                  <ZoomIn className="h-4 w-4 dark:text-white" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className={`bg-white/90 backdrop-blur-sm hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-700 ${isWishlisted ? 'text-rose-500 dark:text-rose-400' : ''}`}
                  onClick={handleWishlist}
                  data-testid="button-wishlist"
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-rose-500 dark:fill-rose-400' : ''}`} />
                </Button>
              </div>
              
              {/* Stock indicator - Updated logic */}
              {!isOutOfStock ? (
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-semibold shadow-lg">
                    <Check className="h-3 w-3 mr-1" />
                    {product.stockQuantity && product.stockQuantity > 0 
                      ? `In Stock (${product.stockQuantity} left)`
                      : 'In Stock'
                    }
                  </Badge>
                </div>
              ) : (
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-gradient-to-r from-rose-600 to-pink-600 text-white text-sm font-semibold shadow-lg animate-pulse">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Out of Stock
                  </Badge>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`
                      flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 
                      transition-all duration-300 relative group
                      ${selectedImage === idx
                        ? 'border-amber-500 ring-2 ring-amber-400/50 ring-offset-2 scale-105 dark:border-amber-400 dark:ring-amber-500/50'
                        : 'border-amber-200 hover:border-amber-400 hover:scale-105 dark:border-amber-800 dark:hover:border-amber-600'
                      }
                    `}
                    data-testid={`button-thumbnail-${idx}`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {selectedImage === idx && (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 dark:from-amber-600/30 dark:to-yellow-600/30"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 dark:from-purple-600 dark:to-pink-600">
                {product.category}
              </Badge>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2 dark:text-white">
                {product.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground dark:text-gray-300">
                  {rating} • {reviewCount} reviews
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-yellow-400">
                KSh {parseFloat(product.price).toLocaleString()}
              </span>
              {hasDiscount && (
                <div className="flex flex-col">
                  <span className="text-lg text-muted-foreground line-through dark:text-gray-400">
                    KSh {parseFloat(product.originalPrice!).toLocaleString()}
                  </span>
                  <Badge className="mt-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs">
                    Save KSh {(parseFloat(product.originalPrice!) - parseFloat(product.price)).toLocaleString()}
                  </Badge>
                </div>
              )}
            </div>

            {/* Description */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none animate-fade-in prose-amber dark:prose-headings:text-white"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />

            <Separator className="border-amber-200 dark:border-amber-800" />

            {/* Quantity and Actions */}
            {!isOutOfStock ? (
              <div className="space-y-4">
                {/* Quantity selector - Fixed dark mode */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-amber-50/50 to-yellow-50/30 border border-amber-200/50 dark:from-gray-800/50 dark:to-gray-900/30 dark:border-gray-700/50 dark:text-gray-200">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      data-testid="button-decrease-quantity"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-800 hover:scale-110 transition-all duration-300 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30 dark:hover:border-amber-600 dark:hover:text-amber-200"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium text-lg dark:text-white" data-testid="text-quantity">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity((q) => q + 1)}
                      data-testid="button-increase-quantity"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-800 hover:scale-110 transition-all duration-300 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30 dark:hover:border-amber-600 dark:hover:text-amber-200"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground dark:text-gray-400 ml-auto">
                    {product.stockQuantity || 10} available
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="flex-1 gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 hover:shadow-xl hover:shadow-amber-200/50 transition-all duration-300 dark:from-amber-600 dark:to-yellow-600 dark:hover:from-amber-700 dark:hover:to-yellow-700"
                    onClick={handleAddToCart}
                    data-testid="button-add-to-cart"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Add to Cart
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-800 transition-all duration-300 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30 dark:hover:border-amber-600 dark:hover:text-amber-200"
                    onClick={handleShare}
                    data-testid="button-share"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <Share2 className="h-5 w-5" />
                    )}
                    {copied ? "Copied!" : "Share"}
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="p-6 bg-gradient-to-r from-rose-50/50 to-pink-50/30 border-rose-200 animate-pulse dark:from-rose-900/20 dark:to-pink-900/20 dark:border-rose-800">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-rose-500 dark:text-rose-400" />
                  <div>
                    <p className="font-medium text-rose-700 dark:text-rose-300">This product is currently out of stock</p>
                    <p className="text-sm text-rose-600 dark:text-rose-400">Check back soon or contact us for availability</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Features Grid - Fixed dark mode visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up">
              {product.deliveryTime && (
                <Card className="p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/30 border-blue-200/50 hover:scale-105 transition-all duration-300 dark:from-gray-800/50 dark:to-gray-900/30 dark:border-gray-700/50">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 group-hover:scale-110 transition-transform duration-300">
                      <Truck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm dark:text-white">Delivery</p>
                      <p className="text-sm text-muted-foreground dark:text-gray-300">
                        {product.deliveryTime}
                        {product.deliveryFee && parseFloat(product.deliveryFee) > 0
                          ? ` - KSh ${parseFloat(product.deliveryFee).toLocaleString()}`
                          : " - Free"}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              {product.returnPolicy && (
                <Card className="p-4 bg-gradient-to-r from-emerald-50/50 to-green-50/30 border-emerald-200/50 hover:scale-105 transition-all duration-300 dark:from-gray-800/50 dark:to-gray-900/30 dark:border-gray-700/50">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 group-hover:scale-110 transition-transform duration-300">
                      <RotateCcw className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm dark:text-white">Returns</p>
                      <p className="text-sm text-muted-foreground dark:text-gray-300">{product.returnPolicy}</p>
                    </div>
                  </div>
                </Card>
              )}
              {product.warranty && (
                <Card className="p-4 bg-gradient-to-r from-amber-50/50 to-yellow-50/30 border-amber-200/50 hover:scale-105 transition-all duration-300 dark:from-gray-800/50 dark:to-gray-900/30 dark:border-gray-700/50">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 group-hover:scale-110 transition-transform duration-300">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm dark:text-white">Warranty</p>
                      <p className="text-sm text-muted-foreground dark:text-gray-300">{product.warranty}</p>
                    </div>
                  </div>
                </Card>
              )}
              <Card className="p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/30 border-purple-200/50 hover:scale-105 transition-all duration-300 dark:from-gray-800/50 dark:to-gray-900/30 dark:border-gray-700/50">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 group-hover:scale-110 transition-transform duration-300">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm dark:text-white">Shipping</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-300">Nationwide • Express available</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-20 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-3xl font-bold text-foreground dark:text-white">
                <span className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent dark:from-amber-400 dark:via-yellow-300 dark:to-amber-400">
                  Related Products
                </span>
              </h2>
              <Link href="/shop">
                <Button 
                  variant="outline" 
                  className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-800 transition-all duration-300 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30 dark:hover:border-amber-600 dark:hover:text-amber-200"
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.slice(0, 4).map((p, idx) => (
                <div 
                  key={p.id} 
                  className="animate-fade-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <ProductCard 
                    product={p} 
                    className="hover:scale-105 hover:shadow-xl hover:shadow-amber-100/20 transition-all duration-500 dark:hover:shadow-amber-900/20"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}