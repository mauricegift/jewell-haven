import { db } from "./db";
import 'dotenv/config';
import { eq, desc, sql, and, like, or, gte, lte, asc } from "drizzle-orm";
import {
  users,
  products,
  orders,
  orderItems,
  cartItems,
  otpCodes,
  contacts,
  contactReplies,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type CartItem,
  type InsertCartItem,
  type OtpCode,
  type InsertOtpCode,
  type Contact,
  type InsertContact,
  type ContactReply,
  type InsertContactReply,
} from "@shared/schema";

export interface IStorage {
  // Users
  createUser(data: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;

  // OTP Codes
  createOtpCode(data: InsertOtpCode): Promise<OtpCode>;
  getOtpCode(email: string, code: string, type: string): Promise<OtpCode | undefined>;
  deleteOtpCodes(email: string, type: string): Promise<void>;

  // Products
  createProduct(data: InsertProduct): Promise<Product>;
  getProductById(id: number): Promise<Product | undefined>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  getAllProducts(): Promise<Product[]>;
  getProducts(options: {
    search?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    sort?: string;
    page?: number;
    limit?: number;
    featured?: boolean;
  }): Promise<{ products: Product[]; total: number; totalPages: number }>;
  getFeaturedProducts(): Promise<Product[]>;
  getLatestProducts(): Promise<Product[]>;
  getRelatedProducts(productId: number, category: string): Promise<Product[]>;
  getProductCount(): Promise<number>;

  // Orders
  createOrder(data: InsertOrder): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order>;
  getUserOrders(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  getOrderCount(): Promise<number>;
  getTotalRevenue(): Promise<number>;
  getRecentOrders(limit: number): Promise<Order[]>;

  // Order Items
  createOrderItem(data: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;

  // Cart Items
  addToCart(data: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  getUserCart(userId: number): Promise<CartItem[]>;
  clearUserCart(userId: number): Promise<void>;

  // Contact methods
  createContact(data: InsertContact): Promise<Contact>;
  getContactById(id: number): Promise<Contact | undefined>;
  getContacts(userId?: number): Promise<Contact[]>;
  getContactsByEmail(email: string): Promise<Contact[]>; // Add this line
  getAdminContacts(): Promise<Contact[]>;
  updateContact(id: number, data: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: number): Promise<void>;
  
  // Contact reply methods
  createContactReply(data: InsertContactReply): Promise<ContactReply>;
  getContactReplies(contactId: number): Promise<ContactReply[]>;
  getUserContactReplies(userEmail: string): Promise<ContactReply[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(users);
    return Number(result.count);
  }

  // OTP Codes
  async createOtpCode(data: InsertOtpCode): Promise<OtpCode> {
    const [otp] = await db.insert(otpCodes).values(data).returning();
    return otp;
  }

  async getOtpCode(email: string, code: string, type: string): Promise<OtpCode | undefined> {
    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.email, email), eq(otpCodes.code, code), eq(otpCodes.type, type)));
    return otp;
  }

  async deleteOtpCodes(email: string, type: string): Promise<void> {
    await db.delete(otpCodes).where(and(eq(otpCodes.email, email), eq(otpCodes.type, type)));
  }

  // Products
  async createProduct(data: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProducts(options: {
    search?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    sort?: string;
    page?: number;
    limit?: number;
    featured?: boolean;
  }): Promise<{ products: Product[]; total: number; totalPages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 12;
    const offset = (page - 1) * limit;

    let whereConditions = [];

    if (options.search) {
      whereConditions.push(
        or(
          like(products.name, `%${options.search}%`),
          like(products.description, `%${options.search}%`)
        )
      );
    }

    if (options.category && options.category !== "all") {
      whereConditions.push(eq(products.category, options.category));
    }

    if (options.featured) {
      whereConditions.push(eq(products.featured, true));
    }

    if (options.priceMin !== undefined) {
      whereConditions.push(gte(products.price, options.priceMin.toString()));
    }

    if (options.priceMax !== undefined) {
      whereConditions.push(lte(products.price, options.priceMax.toString()));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    let orderByClause;
    switch (options.sort) {
      case "price-asc":
        orderByClause = asc(products.price);
        break;
      case "price-desc":
        orderByClause = desc(products.price);
        break;
      case "name-asc":
        orderByClause = asc(products.name);
        break;
      default:
        orderByClause = desc(products.createdAt);
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

    const total = Number(countResult.count);
    const totalPages = Math.ceil(total / limit);

    const result = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return { products: result, total, totalPages };
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(eq(products.featured, true))
      .orderBy(desc(products.createdAt))
      .limit(8);
  }

  async getLatestProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.createdAt)).limit(8);
  }

  async getRelatedProducts(productId: number, category: string): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(and(eq(products.category, category), sql`${products.id} != ${productId}`))
      .orderBy(desc(products.createdAt))
      .limit(4);
  }

  async getProductCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(products);
    return Number(result.count);
  }

  // Orders
  async createOrder(data: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(orders);
    return Number(result.count);
  }

  async getTotalRevenue(): Promise<number> {
    const [result] = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(total AS NUMERIC)), 0)` })
      .from(orders)
      .where(eq(orders.paymentStatus, "paid"));
    return parseFloat(result.total) || 0;
  }

  async getRecentOrders(limit: number): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
  }

  // Order Items
  async createOrderItem(data: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(data).returning();
    return item;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Cart Items
  async addToCart(data: InsertCartItem): Promise<CartItem> {
    const [item] = await db.insert(cartItems).values(data).returning();
    return item;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    const [item] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return item;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async getUserCart(userId: number): Promise<CartItem[]> {
    return db.select().from(cartItems).where(eq(cartItems.userId, userId));
  }

  async clearUserCart(userId: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Contact methods
  async createContact(data: InsertContact): Promise<Contact> {
    const [contact] = await db.insert(contacts).values(data).returning();
    return contact;
  }

  async getContactById(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async getContacts(userId?: number): Promise<Contact[]> {
    if (userId) {
      return db.select().from(contacts).where(eq(contacts.userId, userId)).orderBy(desc(contacts.createdAt));
    } else {
      return db.select().from(contacts).orderBy(desc(contacts.createdAt));
    }
  }

  // NEW: Get contacts by email
  async getContactsByEmail(email: string): Promise<Contact[]> {
    return db.select().from(contacts).where(eq(contacts.email, email)).orderBy(desc(contacts.createdAt));
  }

  async getAdminContacts(): Promise<Contact[]> {
    return db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  async updateContact(id: number, data: Partial<InsertContact>): Promise<Contact> {
    const [contact] = await db
      .update(contacts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return contact;
  }

  async deleteContact(id: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Contact reply methods
  async createContactReply(data: InsertContactReply): Promise<ContactReply> {
    const [reply] = await db.insert(contactReplies).values(data).returning();
    return reply;
  }

  async getContactReplies(contactId: number): Promise<ContactReply[]> {
    return db.select().from(contactReplies).where(eq(contactReplies.contactId, contactId)).orderBy(asc(contactReplies.createdAt));
  }

  async getUserContactReplies(userEmail: string): Promise<ContactReply[]> {
    // First get all contacts by this email
    const userContacts = await db.select().from(contacts).where(eq(contacts.email, userEmail));
    
    if (userContacts.length === 0) {
      return [];
    }
    
    const contactIds = userContacts.map(contact => contact.id);
    
    // Then get all replies for these contacts
    return db.select().from(contactReplies)
      .where(sql`${contactReplies.contactId} IN (${contactIds.join(',')})`)
      .orderBy(asc(contactReplies.createdAt));
  }
}

export const storage = new DatabaseStorage();