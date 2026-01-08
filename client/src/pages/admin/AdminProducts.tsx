import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  Package,
  Menu,
  Tag,
  DollarSign,
  TrendingUp,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  PackageOpen,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminLayout } from "./AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  price: z.string().min(1, "Price is required")
    .refine((val) => !isNaN(parseFloat(val)), "Price must be a valid number"),
  originalPrice: z.string().optional()
    .refine((val) => !val || !isNaN(parseFloat(val)), "Original price must be a valid number"),
  inStock: z.boolean().default(true),
  stockQuantity: z.coerce.number().min(0).default(0),
  warranty: z.string().optional(),
  returnPolicy: z.string().optional(),
  deliveryFee: z.string().optional()
    .refine((val) => !val || !isNaN(parseFloat(val)), "Delivery fee must be a valid number"),
  deliveryTime: z.string().optional(),
  featured: z.boolean().default(false),
});

type ProductForm = z.infer<typeof productSchema>;

const categories = [
  "rings",
  "necklaces",
  "earrings",
  "bracelets",
  "watches",
  "pendants",
];

export default function AdminProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [animateRefresh, setAnimateRefresh] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is admin
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/user/me"],
  });

  const { data: products, isLoading, refetch } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
    enabled: !!currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin"),
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      price: "",
      originalPrice: "",
      inStock: true,
      stockQuantity: 0,
      warranty: "",
      returnPolicy: "",
      deliveryFee: "",
      deliveryTime: "",
      featured: false,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Saving product data:', data);
      
      // Prepare data for backend
      const requestData = {
        ...data,
        price: parseFloat(data.price),
        originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : null,
        stockQuantity: parseInt(data.stockQuantity.toString()),
        deliveryFee: data.deliveryFee ? parseFloat(data.deliveryFee) : null,
        image: data.image,
      };

      if (editingProduct) {
        return apiRequest("PATCH", `/api/admin/products/${editingProduct.id}`, requestData);
      }
      return apiRequest("POST", "/api/admin/products", requestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/latest"] });
      setDialogOpen(false);
      setEditingProduct(null);
      form.reset();
      setImage(null);
      toast({
        title: editingProduct ? "Product updated" : "Product created",
        description: `The product has been ${editingProduct ? "updated" : "created"} successfully.`,
      });
    },
    onError: (error: any) => {
      console.error('Product save error:', error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/products/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/latest"] });
      toast({
        title: "Product deleted",
        description: "The product has been removed.",
      });
    },
    onError: (error: any) => {
      console.error('Product delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Could not delete product",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please choose an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setImage(product.image || null);
    form.reset({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      originalPrice: product.originalPrice ? product.originalPrice.toString() : "",
      inStock: product.inStock,
      stockQuantity: product.stockQuantity,
      warranty: product.warranty || "",
      returnPolicy: product.returnPolicy || "",
      deliveryFee: product.deliveryFee ? product.deliveryFee.toString() : "",
      deliveryTime: product.deliveryTime || "",
      featured: product.featured,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingProduct(null);
    setImage(null);
    form.reset();
    setDialogOpen(true);
  };

  const onSubmit = (data: ProductForm) => {
    if (!image && !editingProduct) {
      toast({
        title: "Image required",
        description: "Please upload a product image.",
        variant: "destructive",
      });
      return;
    }

    // Validate image is base64
    if (image && !image.startsWith('data:image/')) {
      toast({
        title: "Invalid image",
        description: "Please upload a valid image file.",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({ ...data, image });
  };

  const handleRefresh = () => {
    setAnimateRefresh(true);
    refetch();
    setTimeout(() => setAnimateRefresh(false), 500);
  };

  // Check user authorization
  useEffect(() => {
    if (!userLoading && currentUser && !(currentUser.role === "admin" || currentUser.role === "superadmin")) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      // Redirect to home or login
      window.location.href = "/";
    }
  }, [currentUser, userLoading, toast]);

  const filteredProducts = products?.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (userLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 animate-in fade-in duration-500">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 sm:p-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in slide-in-from-top-2 duration-500">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent animate-in fade-in duration-700">
              Products
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground animate-in fade-in duration-700 delay-100">
              Manage your product catalog
            </p>
          </div>
          <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-500">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 sm:w-auto sm:px-3 hover:scale-105 transition-transform duration-200"
              title="Refresh products"
            >
              <RefreshCw className={`h-4 w-4 ${animateRefresh ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Refresh</span>
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="gap-2 w-full sm:w-auto hover:scale-105 transition-transform duration-200" 
                  onClick={openNewDialog} 
                  data-testid="button-add-product"
                >
                  <Plus className="h-4 w-4 animate-in fade-in duration-300" />
                  <span className="hidden sm:inline animate-in fade-in duration-300 delay-100">Add Product</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-3xl w-[95vw] sm:w-full animate-in zoom-in-95 duration-300">
                <DialogHeader className="animate-in fade-in duration-500">
                  <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in duration-500 delay-100">
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Product Image *
                    </Label>
                    <div
                      className="border-2 border-dashed rounded-lg p-3 sm:p-4 text-center cursor-pointer hover:border-primary transition-all duration-300 hover:scale-105 hover:shadow-md"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {image ? (
                        <div className="relative inline-block animate-in zoom-in-95 duration-300">
                          <img
                            src={image}
                            alt="Preview"
                            className="max-h-32 sm:max-h-40 rounded-md mx-auto shadow-lg hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImage(null);
                            }}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-white hover:scale-110 transition-transform duration-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-3 sm:py-4 animate-in fade-in duration-300">
                          <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground mb-2 animate-bounce" />
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Click to upload image (Required for new products)
                          </p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      <Label htmlFor="name" className="text-sm sm:text-base flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Product Name *
                      </Label>
                      <Input
                        id="name"
                        {...form.register("name")}
                        placeholder="Gold Ring"
                        className="text-sm sm:text-base hover:border-primary transition-colors duration-200"
                        data-testid="input-product-name"
                      />
                      {form.formState.errors.name && (
                        <p className="text-xs sm:text-sm text-destructive animate-in fade-in duration-300">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-2 duration-300">
                      <Label htmlFor="category" className="text-sm sm:text-base flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Category *
                      </Label>
                      <Select
                        value={form.watch("category")}
                        onValueChange={(v) => form.setValue("category", v)}
                      >
                        <SelectTrigger className="text-sm sm:text-base hover:border-primary transition-colors duration-200" data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="animate-in zoom-in-95 duration-200">
                          {categories.map((cat) => (
                            <SelectItem 
                              key={cat} 
                              value={cat} 
                              className="text-sm sm:text-base hover:scale-105 transition-transform duration-200"
                            >
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.category && (
                        <p className="text-xs sm:text-sm text-destructive animate-in fade-in duration-300">
                          {form.formState.errors.category.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 animate-in fade-in duration-300">
                    <Label htmlFor="description" className="text-sm sm:text-base">Description *</Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
                      placeholder="Describe your product..."
                      rows={3}
                      className="text-sm sm:text-base resize-y min-h-[100px] hover:border-primary transition-colors duration-200"
                      data-testid="input-product-description"
                    />
                    {form.formState.errors.description && (
                      <p className="text-xs sm:text-sm text-destructive animate-in fade-in duration-300">
                        {form.formState.errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      <Label htmlFor="price" className="text-sm sm:text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Price (KSh) *
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        {...form.register("price")}
                        placeholder="5000"
                        className="text-sm sm:text-base hover:border-primary transition-colors duration-200"
                        data-testid="input-product-price"
                      />
                      {form.formState.errors.price && (
                        <p className="text-xs sm:text-sm text-destructive animate-in fade-in duration-300">
                          {form.formState.errors.price.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <Label htmlFor="originalPrice" className="text-sm sm:text-base">Original Price (Optional)</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        step="0.01"
                        {...form.register("originalPrice")}
                        placeholder="6000"
                        className="text-sm sm:text-base hover:border-primary transition-colors duration-200"
                        data-testid="input-product-original-price"
                      />
                      {form.formState.errors.originalPrice && (
                        <p className="text-xs sm:text-sm text-destructive animate-in fade-in duration-300">
                          {form.formState.errors.originalPrice.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-2 duration-300">
                      <Label htmlFor="stockQuantity" className="text-sm sm:text-base">Stock Quantity</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        {...form.register("stockQuantity")}
                        placeholder="10"
                        className="text-sm sm:text-base hover:border-primary transition-colors duration-200"
                        data-testid="input-product-stock"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      <Label htmlFor="warranty" className="text-sm sm:text-base">Warranty</Label>
                      <Input
                        id="warranty"
                        {...form.register("warranty")}
                        placeholder="1 year warranty"
                        className="text-sm sm:text-base hover:border-primary transition-colors duration-200"
                        data-testid="input-product-warranty"
                      />
                    </div>
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-2 duration-300">
                      <Label htmlFor="returnPolicy" className="text-sm sm:text-base">Return Policy</Label>
                      <Input
                        id="returnPolicy"
                        {...form.register("returnPolicy")}
                        placeholder="30 days return"
                        className="text-sm sm:text-base hover:border-primary transition-colors duration-200"
                        data-testid="input-product-return"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      <Label htmlFor="deliveryFee" className="text-sm sm:text-base">Delivery Fee (KSh)</Label>
                      <Input
                        id="deliveryFee"
                        type="number"
                        step="0.01"
                        {...form.register("deliveryFee")}
                        placeholder="200"
                        className="text-sm sm:text-base hover:border-primary transition-colors duration-200"
                        data-testid="input-product-delivery-fee"
                      />
                      {form.formState.errors.deliveryFee && (
                        <p className="text-xs sm:text-sm text-destructive animate-in fade-in duration-300">
                          {form.formState.errors.deliveryFee.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-2 duration-300">
                      <Label htmlFor="deliveryTime" className="text-sm sm:text-base">Delivery Time</Label>
                      <Input
                        id="deliveryTime"
                        {...form.register("deliveryTime")}
                        placeholder="3-5 business days"
                        className="text-sm sm:text-base hover:border-primary transition-colors duration-200"
                        data-testid="input-product-delivery-time"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-3 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <div className="flex items-center gap-2 animate-in fade-in duration-300">
                        <Switch
                          id="inStock"
                          checked={form.watch("inStock")}
                          onCheckedChange={(v) => form.setValue("inStock", v)}
                          className="scale-90 sm:scale-100 hover:scale-110 transition-transform duration-200"
                          data-testid="switch-in-stock"
                        />
                        <Label htmlFor="inStock" className="text-sm sm:text-base cursor-pointer flex items-center gap-2">
                          {form.watch("inStock") ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                          In Stock
                        </Label>
                      </div>
                      <div className="flex items-center gap-2 animate-in fade-in duration-300 delay-100">
                        <Switch
                          id="featured"
                          checked={form.watch("featured")}
                          onCheckedChange={(v) => form.setValue("featured", v)}
                          className="scale-90 sm:scale-100 hover:scale-110 transition-transform duration-200"
                          data-testid="switch-featured"
                        />
                        <Label htmlFor="featured" className="text-sm sm:text-base cursor-pointer flex items-center gap-2">
                          <Star className="h-4 w-4 text-amber-500" />
                          Featured
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 animate-in fade-in duration-300">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        setEditingProduct(null);
                        setImage(null);
                        form.reset();
                      }}
                      className="flex-1 hover:scale-105 transition-transform duration-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saveMutation.isPending}
                      className="flex-1 hover:scale-105 transition-transform duration-200"
                      data-testid="button-save-product"
                    >
                      {saveMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : editingProduct ? (
                        "Update Product"
                      ) : (
                        "Create Product"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Card */}
        <Card className="overflow-hidden border-0 shadow-lg animate-in fade-in duration-500">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="relative flex-1 animate-in fade-in duration-500">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-pulse" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm sm:text-base hover:border-primary transition-colors duration-200 focus:ring-2 focus:ring-primary"
                  data-testid="input-search-products"
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
              
              <div className="flex flex-wrap gap-2 animate-in fade-in duration-500 delay-100">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] text-sm hover:scale-105 transition-transform duration-200">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className="animate-in zoom-in-95 duration-200">
                    <SelectItem value="all" className="text-sm hover:scale-105 transition-transform duration-200">
                      All Categories
                    </SelectItem>
                    {categories.map((cat) => (
                      <SelectItem 
                        key={cat} 
                        value={cat} 
                        className="text-sm hover:scale-105 transition-transform duration-200"
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {(searchQuery || categoryFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("all");
                    }}
                    className="hover:scale-105 transition-transform duration-200"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {isLoading ? (
              <div className="space-y-4 p-4 sm:p-0 animate-in fade-in duration-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    className="h-16 w-full animate-pulse" 
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                  {/* Mobile Card View */}
                  <div className="sm:hidden space-y-4 p-4 animate-in fade-in duration-500">
                    {filteredProducts.map((product, index) => (
                      <Card 
                        key={product.id} 
                        className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                        data-testid={`card-product-${product.id}`}
                        onClick={() => openEditDialog(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-16 h-16 object-cover rounded-md hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h3 className="font-medium text-sm truncate hover:text-primary transition-colors duration-200">
                                  {product.name}
                                </h3>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:scale-110 transition-transform duration-200">
                                      <Menu className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="animate-in zoom-in-95 duration-200">
                                    <DropdownMenuItem onClick={() => openEditDialog(product)} className="hover:scale-105 transition-transform duration-200">
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-destructive hover:scale-105 transition-transform duration-200"
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this product?')) {
                                          deleteMutation.mutate(product.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs capitalize hover:scale-105 transition-transform duration-200">
                                    <Package className="h-3 w-3 mr-1" />
                                    {product.category}
                                  </Badge>
                                  <span className="text-xs font-medium animate-pulse">
                                    <DollarSign className="inline h-3 w-3 mr-1" />
                                    KSh {parseFloat(product.price.toString()).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={product.inStock ? "secondary" : "destructive"} 
                                    className="text-xs hover:scale-105 transition-transform duration-200"
                                  >
                                    {product.inStock ? (
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                    ) : (
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                    )}
                                    {product.inStock ? "In Stock" : "Out of Stock"}
                                  </Badge>
                                  {product.featured && (
                                    <Badge className="text-xs hover:scale-105 transition-transform duration-200">
                                      <Star className="h-3 w-3 mr-1" />
                                      Featured
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    Stock: {product.stockQuantity}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <Table className="hidden sm:table">
                    <TableHeader>
                      <TableRow className="animate-in fade-in duration-500">
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product, index) => (
                        <TableRow 
                          key={product.id} 
                          data-testid={`row-product-${product.id}`}
                          className="animate-in fade-in slide-in-from-left-2 duration-300 hover:bg-muted/50 transition-colors"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <TableCell>
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-md hover:scale-110 transition-transform duration-300 shadow-md"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium hover:text-primary transition-colors duration-200 cursor-pointer" onClick={() => openEditDialog(product)}>
                            {product.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize hover:scale-105 transition-transform duration-200">
                              {product.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium animate-pulse">
                              KSh {parseFloat(product.price.toString()).toLocaleString()}
                            </span>
                            {product.originalPrice && (
                              <p className="text-xs text-muted-foreground line-through">
                                KSh {parseFloat(product.originalPrice.toString()).toLocaleString()}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>{product.stockQuantity}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Badge 
                                variant={product.inStock ? "secondary" : "destructive"} 
                                className="hover:scale-105 transition-transform duration-200"
                              >
                                {product.inStock ? "In Stock" : "Out of Stock"}
                              </Badge>
                              {product.featured && (
                                <Badge className="hover:scale-105 transition-transform duration-200">
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2 animate-in fade-in duration-300">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(product)}
                                data-testid={`button-edit-${product.id}`}
                                className="hover:scale-110 transition-transform duration-200 hover:bg-primary/10"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:scale-110 transition-transform duration-200"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this product?')) {
                                    deleteMutation.mutate(product.id);
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                                data-testid={`button-delete-${product.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-4 animate-in fade-in duration-500">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 flex items-center justify-center animate-bounce">
                  <PackageOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2 animate-in fade-in duration-300">No products found</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 animate-in fade-in duration-300 delay-100">
                  {searchQuery || categoryFilter !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "There are no products yet"}
                </p>
                {(searchQuery || categoryFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("all");
                    }}
                    className="text-sm animate-in fade-in duration-300 delay-200 hover:scale-105 transition-transform duration-200"
                  >
                    Clear filters
                  </Button>
                )}
                {(!searchQuery && categoryFilter === "all") && (
                  <Button
                    onClick={openNewDialog}
                    className="mt-4 hover:scale-105 transition-transform duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}