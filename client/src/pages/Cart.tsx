import { Link } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function Cart() {
  const { items, updateQuantity, removeFromCart, subtotal, totalDeliveryFee, total } = useCart();
  const { user } = useAuth();

  // Inline style for bounce animation
  const bounceStyle = {
    animation: 'bounce 1s ease-in-out',
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center space-y-4">
          <div 
            className="p-6 rounded-full bg-muted inline-block"
            style={{
              animation: 'bounce 1s ease-in-out infinite',
            }}
          >
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Your Cart is Empty
          </h1>
          <p className="text-muted-foreground max-w-sm">
            Looks like you haven't added any jewelry to your cart yet. Start shopping to find your perfect piece!
          </p>
          <Link href="/shop">
            <Button className="gap-2 mt-4" data-testid="button-start-shopping">
              Start Shopping
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 md:py-8">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.product.id} className="overflow-hidden" data-testid={`cart-item-${item.product.id}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Link href={`/product/${item.product.id}`} className="flex-shrink-0">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-md overflow-hidden bg-muted">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            No Image
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4">
                        <div>
                          <Link href={`/product/${item.product.id}`}>
                            <h3 className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2">
                              {item.product.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.product.category}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                          data-testid={`button-remove-${item.product.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-end justify-between mt-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            data-testid={`button-decrease-${item.product.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-10 text-center font-medium" data-testid={`quantity-${item.product.id}`}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            data-testid={`button-increase-${item.product.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-primary" data-testid={`price-${item.product.id}`}>
                            KSh {(parseFloat(item.product.price) * item.quantity).toLocaleString()}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-muted-foreground">
                              KSh {parseFloat(item.product.price).toLocaleString()} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)
                    </span>
                    <span className="font-medium" data-testid="text-subtotal">
                      KSh {subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-medium" data-testid="text-delivery">
                      {totalDeliveryFee > 0
                        ? `KSh ${totalDeliveryFee.toLocaleString()}`
                        : "Calculated at checkout"}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary" data-testid="text-total">
                    KSh {total.toLocaleString()}
                  </span>
                </div>

                {user ? (
                  <Link href="/checkout">
                    <Button className="w-full gap-2" size="lg" data-testid="button-checkout">
                      Proceed to Checkout
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link href="/login?redirect=/checkout">
                      <Button className="w-full gap-2" size="lg" data-testid="button-login-checkout">
                        Login to Checkout
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <p className="text-xs text-center text-muted-foreground">
                      Don't have an account?{" "}
                      <Link href="/signup" className="text-primary hover:underline">
                        Sign up
                      </Link>
                    </p>
                  </div>
                )}

                <Link href="/shop">
                  <Button variant="outline" className="w-full" data-testid="button-continue-shopping">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}