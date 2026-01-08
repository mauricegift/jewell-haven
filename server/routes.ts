import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { 
  loginSchema, 
  signupSchema, 
  verifyOtpSchema, 
  resetPasswordSchema 
} from "@shared/schema";

// Dynamic import for jsPDF to handle potential module issues
let jsPDF: any;
let autoTable: any;

// Contact form schema
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  console.error(
    "WARNING: SESSION_SECRET environment variable is not set. Authentication will not work securely.",
  );
}

const SMS_API_URL = process.env.SMS_API_URL;
const MPESA_API_URL = process.env.MPESA_API_URL;
const EMAIL_API_URL = process.env.EMAIL_API_URL;
const SMS_API_TOKEN = process.env.SMS_API_TOKEN;
const SMS_SENDER_ID = process.env.SMS_SENDER_ID;

// Increase request size limits for image uploads
export function configureExpress(app: Express) {
  app.use(require("express").json({ limit: "20mb" }));
  app.use(require("express").urlencoded({ limit: "20mb", extended: true }));
}

function generateOrderNumber(): string {
  const prefix = "JH";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmailOtp(
  email: string,
  code: string,
  type: string,
): Promise<boolean> {
  try {
    // Map types to the correct endpoints
    const endpointMap: Record<string, string> = {
      signup: `${EMAIL_API_URL}/api/sendSignupCode`,
      reset: `${EMAIL_API_URL}/api/sendResetCode`,
      resend: `${EMAIL_API_URL}/api/sendResendCode`,
      delete: `${EMAIL_API_URL}/api/sendDeleteCode`,
    };

    const endpoint =
      endpointMap[type] ||
      `${EMAIL_API_URL}/api/sendSignupCode`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        username: email.split("@")[0], // Extract username from email
        code,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Email API error (${response.status}):`, errorText);
      return false;
    }

    return response.ok;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

async function sendSmsOtp(phone: string, code: string): Promise<boolean> {
  if (!SMS_API_TOKEN) {
    console.error("SMS API token not configured");
    return false;
  }

  try {
    const formattedPhone = phone.startsWith("0")
      ? "254" + phone.slice(1)
      : phone.startsWith("+")
        ? phone.slice(1)
        : phone;

    const response = await fetch(`${SMS_API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SMS_API_TOKEN}`,
      },
      body: JSON.stringify({
        recipient: formattedPhone,
        sender_id: `${SMS_SENDER_ID}`,
        type: "plain",
        message: `Your JEWEL HAVEN Code is: ${code}. Valid for 10 minutes.`,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("SMS send error:", error);
    return false;
  }
}

function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded;
  } catch {
    return null;
  }
}

async function authenticateRequest(
  req: any,
): Promise<{ userId: number } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  return verifyToken(token);
}

async function isAdmin(userId: number): Promise<boolean> {
  const user = await storage.getUserById(userId);
  return user?.role === "admin" || user?.role === "superadmin";
}

// Function to update product stock when payment is completed
async function updateProductStock(orderId: number): Promise<void> {
  try {
    const orderItems = await storage.getOrderItems(orderId);
    
    for (const item of orderItems) {
      const product = await storage.getProductById(item.productId);
      if (product) {
        const newStockQuantity = Math.max(0, product.stockQuantity - item.quantity);
        const stockStatus = newStockQuantity === 0 ? "out of stock" : "in stock";
        
        await storage.updateProduct(product.id, {
          stockQuantity: newStockQuantity,
          stockStatus
        });
        
        console.log(`Updated product ${product.id} stock from ${product.stockQuantity} to ${newStockQuantity}`);
      }
    }
  } catch (error) {
    console.error("Error updating product stock:", error);
    throw error;
  }
}

// Function to generate invoice PDF with better error handling
async function generateInvoice(order: any, orderItems: any[], isAdminCopy: boolean = false): Promise<Buffer> {
  try {
    // Dynamically import jsPDF to handle potential module issues
    const jsPDFModule = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    
    const { jsPDF: JsPDF } = jsPDFModule.default || jsPDFModule;
    const autoTableFunc = autoTableModule.default;
    
    const doc = new JsPDF();
    
    // Add logo and header
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text("JEWEL HAVEN", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Luxury Jewelry & Accessories", 105, 28, { align: "center" });
    doc.text("Eldoret, Kenya", 105, 34, { align: "center" });
    doc.text("info@jewelhaven.giftedtech.co.ke | +254 799 916 673", 105, 40, { align: "center" });
    
    // Invoice title and details
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80);
    doc.text(isAdminCopy ? "ADMIN COPY - INVOICE" : "CUSTOMER COPY - INVOICE", 105, 55, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 70);
    doc.text(`Invoice Number: ${order.orderNumber}`, 20, 76);
    
    doc.text(`Customer: ${order.deliveryName || 'N/A'}`, 130, 70);
    doc.text(`Phone: ${order.deliveryPhone || 'N/A'}`, 130, 76);
    const address = order.deliveryAddress || 'N/A';
    doc.text(`Address: ${address.substring(0, 30)}${address.length > 30 ? '...' : ''}`, 130, 82);
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 88, 190, 88);
    
    // Order items table
    const tableData = orderItems.map(item => [
      item.productName || 'Product',
      `KSh ${parseFloat(item.price || 0).toLocaleString()}`,
      item.quantity || 1,
      `KSh ${((parseFloat(item.price || 0)) * (item.quantity || 1)).toLocaleString()}`
    ]);
    
    autoTableFunc(doc, {
      startY: 95,
      head: [['Description', 'Unit Price', 'Quantity', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [44, 62, 80], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 40, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });
    
    // Get the final Y position safely
    let finalY = 120;
    const autoTableApi = (doc as any).lastAutoTable;
    if (autoTableApi && autoTableApi.finalY) {
      finalY = autoTableApi.finalY + 10;
    }
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text("Summary", 20, finalY);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Subtotal: KSh ${parseFloat(order.subtotal || 0).toLocaleString()}`, 150, finalY, { align: 'right' });
    doc.text(`Delivery Fee: KSh ${parseFloat(order.deliveryFee || 0).toLocaleString()}`, 150, finalY + 6, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text(`Total: KSh ${parseFloat(order.total || 0).toLocaleString()}`, 150, finalY + 16, { align: 'right' });
    
    // Payment details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Payment Method: ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'N/A'}`, 20, finalY + 30);
    doc.text(`Payment Status: ${order.paymentStatus ? order.paymentStatus.toUpperCase() : 'N/A'}`, 20, finalY + 36);
    
    if (order.mpesaReceiptNumber) {
      doc.text(`M-Pesa Receipt: ${order.mpesaReceiptNumber}`, 20, finalY + 42);
    }
    
    if (order.notes) {
      doc.text(`Notes: ${order.notes.substring(0, 60)}${order.notes.length > 60 ? '...' : ''}`, 20, finalY + 48);
    }
    
    // Footer
    const footerY = finalY + 65;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for shopping with Jewel Haven!", 105, footerY, { align: "center" });
    doc.text("This is a system-generated invoice", 105, footerY + 5, { align: "center" });
    
    // Ensure the PDF fits in one page or add page numbers if needed
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, 105, 280, { align: "center" });
    }
    
    // Convert to Buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF invoice");
  }
}

// Alternative simpler PDF generation without autoTable
async function generateSimpleInvoice(order: any, orderItems: any[], isAdminCopy: boolean = false): Promise<Buffer> {
  try {
    // Dynamically import jsPDF
    const jsPDFModule = await import('jspdf');
    const { jsPDF: JsPDF } = jsPDFModule.default || jsPDFModule;
    
    const doc = new JsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text("JEWEL HAVEN INVOICE", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(isAdminCopy ? "ADMIN COPY" : "CUSTOMER COPY", 105, 30, { align: "center" });
    
    // Invoice details
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${order.orderNumber}`, 20, 45);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 52);
    doc.text(`Customer: ${order.deliveryName || 'N/A'}`, 20, 59);
    doc.text(`Phone: ${order.deliveryPhone || 'N/A'}`, 20, 66);
    
    // Order items header
    doc.setFontSize(11);
    doc.setTextColor(44, 62, 80);
    doc.text("Order Items", 20, 80);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Item", 20, 90);
    doc.text("Price", 100, 90);
    doc.text("Qty", 130, 90);
    doc.text("Total", 160, 90);
    
    // Draw line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 93, 190, 93);
    
    // Order items
    let yPos = 100;
    let totalAmount = 0;
    
    for (const item of orderItems) {
      const itemTotal = parseFloat(item.price || 0) * (item.quantity || 1);
      totalAmount += itemTotal;
      
      doc.text(item.productName || 'Product', 20, yPos);
      doc.text(`KSh ${parseFloat(item.price || 0).toLocaleString()}`, 100, yPos);
      doc.text(`${item.quantity || 1}`, 130, yPos);
      doc.text(`KSh ${itemTotal.toLocaleString()}`, 160, yPos);
      
      yPos += 7;
      
      // Add new page if needed
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
    }
    
    // Summary
    yPos = Math.max(yPos + 10, 120);
    doc.setFontSize(11);
    doc.setTextColor(44, 62, 80);
    doc.text("Summary", 20, yPos);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Subtotal: KSh ${parseFloat(order.subtotal || 0).toLocaleString()}`, 140, yPos, { align: 'right' });
    doc.text(`Delivery Fee: KSh ${parseFloat(order.deliveryFee || 0).toLocaleString()}`, 140, yPos + 7, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text(`Total: KSh ${parseFloat(order.total || 0).toLocaleString()}`, 140, yPos + 17, { align: 'right' });
    
    // Payment details
    yPos += 35;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Payment Method: ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'N/A'}`, 20, yPos);
    doc.text(`Payment Status: ${order.paymentStatus ? order.paymentStatus.toUpperCase() : 'N/A'}`, 20, yPos + 7);
    
    if (order.mpesaReceiptNumber) {
      doc.text(`M-Pesa Receipt: ${order.mpesaReceiptNumber}`, 20, yPos + 14);
    }
    
    // Footer
    const footerY = Math.max(yPos + 30, 250);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for shopping with Jewel Haven!", 105, footerY, { align: "center" });
    
    // Convert to Buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating simple PDF:", error);
    throw new Error("Failed to generate invoice");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<void> {
  // Configure express middleware with increased limits
  app.use(require("express").json({ limit: "10mb" }));
  app.use(require("express").urlencoded({ limit: "10mb", extended: true }));

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = signupSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const userCount = await storage.getUserCount();
      const role = userCount === 0 ? "superadmin" : "user";

      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
        role,
        isVerified: false,
      });

      const code = generateOtp();
      await storage.deleteOtpCodes(data.email, "signup");
      await storage.createOtpCode({
        email: data.email,
        code,
        type: "signup",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      if (data.otpPreference === "sms" && data.phone) {
        await sendSmsOtp(data.phone, code);
      } else {
        await sendEmailOtp(data.email, code, "signup");
      }

      res.json({ message: "Verification code sent", userId: user.id });
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { email, code } = verifyOtpSchema.parse(req.body);

      const otp = await storage.getOtpCode(email, code, "signup");
      if (!otp || new Date() > otp.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      await storage.updateUser(user.id, { isVerified: true });
      await storage.deleteOtpCodes(email, "signup");

      res.json({ message: "Account verified successfully" });
    } catch (error) {
      console.error("Verify error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.post("/api/auth/resend-code", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const code = generateOtp();
      await storage.deleteOtpCodes(email, "signup");
      await storage.createOtpCode({
        email,
        code,
        type: "signup",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      if (user.otpPreference === "sms" && user.phone) {
        await sendSmsOtp(user.phone, code);
      } else {
        await sendEmailOtp(email, code, "resend");
      }

      res.json({ message: "Code resent" });
    } catch (error) {
      console.error("Resend error:", error);
      res.status(500).json({ message: "Failed to resend code" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.isVerified) {
        const code = generateOtp();
        await storage.deleteOtpCodes(email, "signup");
        await storage.createOtpCode({
          email,
          code,
          type: "signup",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        if (user.otpPreference === "sms" && user.phone) {
          await sendSmsOtp(user.phone, code);
        } else {
          await sendEmailOtp(email, code, "signup");
        }

        return res.json({ requiresVerification: true });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "7d",
      });
      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Add this endpoint to get current user
  app.get("/api/user/me", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUserById(auth.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({
          message: "If the email exists, a reset code has been sent",
        });
      }

      const code = generateOtp();
      await storage.deleteOtpCodes(email, "reset");
      await storage.createOtpCode({
        email,
        code,
        type: "reset",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await sendEmailOtp(email, code, "reset");
      res.json({ message: "Reset code sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to send reset code" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = resetPasswordSchema.parse(req.body);

      const otp = await storage.getOtpCode(email, code, "reset");
      if (!otp || new Date() > otp.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword });
      await storage.deleteOtpCodes(email, "reset");

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // User profile routes
  app.patch("/api/user/profile", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { name, phone } = req.body;
      const user = await storage.updateUser(auth.userId, { name, phone });
      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch("/api/user/password", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await storage.getUserById(auth.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!validPassword) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(auth.userId, { password: hashedPassword });

      res.json({ message: "Password updated" });
    } catch (error) {
      console.error("Update password error:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  app.patch("/api/user/picture", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { picture } = req.body;
      if (!picture) {
        return res.status(400).json({ message: "Picture is required" });
      }

      // Validate that it's a base64 string
      if (!picture.startsWith("data:image/")) {
        return res.status(400).json({ message: "Invalid image format" });
      }

      // Check size (base64 is about 33% larger than binary)
      const base64Size = (picture.length * 3) / 4;
      if (base64Size > 10 * 1024 * 1024) {
        // 10MB limit for base64
        return res
          .status(413)
          .json({ message: "Image too large. Please use an image under 7MB." });
      }

      const user = await storage.updateUser(auth.userId, {
        profilePicture: picture,
      });
      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Update picture error:", error);
      res.status(500).json({ message: "Failed to update picture" });
    }
  });

  app.get("/api/user/orders", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orders = await storage.getUserOrders(auth.userId);
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  // Get order by order number
  app.get("/api/orders/:orderNumber", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { orderNumber } = req.params;
      const orders = await storage.getUserOrders(auth.userId);
      const order = orders.find(o => o.orderNumber === orderNumber);
      
      if (!order) {
        // Check if user is admin
        const user = await storage.getUserById(auth.userId);
        if (user?.role === "admin" || user?.role === "superadmin") {
          const allOrders = await storage.getAllOrders();
          const adminOrder = allOrders.find(o => o.orderNumber === orderNumber);
          
          if (!adminOrder) {
            return res.status(404).json({ message: "Order not found" });
          }
          
          const items = await storage.getOrderItems(adminOrder.id);
          return res.json({ ...adminOrder, items });
        }
        return res.status(404).json({ message: "Order not found" });
      }

      const items = await storage.getOrderItems(order.id);
      res.json({ ...order, items });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Failed to get order" });
    }
  });

  // Invoice download endpoint - IMPROVED VERSION
  app.get("/api/orders/:orderNumber/invoice", async (req, res) => {
    try {
      console.log(`Invoice request for order: ${req.params.orderNumber}, type: ${req.query.type}`);
      
      const auth = await authenticateRequest(req);
      if (!auth) {
        console.log("No auth token provided");
        return res.status(401).json({ message: "Unauthorized. Please log in." });
      }

      const { orderNumber } = req.params;
      const { type = "customer" } = req.query;
      
      // Get user details
      const user = await storage.getUserById(auth.userId);
      if (!user) {
        console.log(`User ${auth.userId} not found`);
        return res.status(401).json({ message: "User not found" });
      }
      
      console.log(`User found: ${user.email}, role: ${user.role}`);
      
      // Get order
      let order;
      let items = [];
      
      if (user?.role === "admin" || user?.role === "superadmin") {
        // Admin can access any order
        console.log("Admin access - searching all orders");
        const allOrders = await storage.getAllOrders();
        order = allOrders.find(o => o.orderNumber === orderNumber);
        
        if (order) {
          console.log(`Order found by admin: ${order.id}`);
          items = await storage.getOrderItems(order.id);
        }
      } else {
        // Regular user can only access their own orders
        console.log("User access - searching user orders");
        const userOrders = await storage.getUserOrders(auth.userId);
        order = userOrders.find(o => o.orderNumber === orderNumber);
        
        if (order) {
          console.log(`Order found by user: ${order.id}`);
          items = await storage.getOrderItems(order.id);
        }
      }

      if (!order) {
        console.log(`Order ${orderNumber} not found`);
        return res.status(404).json({ message: "Order not found" });
      }

      if (!items || items.length === 0) {
        console.log(`No items found for order ${orderNumber}`);
        return res.status(404).json({ message: "No items found for this order" });
      }

      console.log(`Generating invoice for order ${orderNumber} with ${items.length} items`);
      
      // Generate PDF - try both methods
      const isAdminCopy = type === "admin";
      let pdfBuffer: Buffer;
      
      try {
        // First try with autoTable
        console.log("Attempting to generate invoice with autoTable...");
        pdfBuffer = await generateInvoice(order, items, isAdminCopy);
        console.log("Invoice generated successfully with autoTable");
      } catch (autoTableError) {
        console.log("AutoTable failed, trying simple invoice:", autoTableError.message);
        
        // Fallback to simple invoice
        try {
          pdfBuffer = await generateSimpleInvoice(order, items, isAdminCopy);
          console.log("Invoice generated successfully with simple method");
        } catch (simpleError) {
          console.error("Both invoice generation methods failed:", simpleError);
          
          // Return a text-based invoice as fallback
          const invoiceText = generateTextInvoice(order, items, isAdminCopy);
          const textBuffer = Buffer.from(invoiceText, 'utf-8');
          
          res.setHeader('Content-Type', 'text/plain');
          res.setHeader('Content-Disposition', `attachment; filename=${isAdminCopy ? 'admin-invoice-' : 'customer-invoice-'}${orderNumber}.txt`);
          res.setHeader('Content-Length', textBuffer.length);
          return res.send(textBuffer);
        }
      }
      
      // Set headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${isAdminCopy ? 'admin-invoice-' : 'customer-invoice-'}${orderNumber}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF
      console.log(`Sending PDF invoice (${pdfBuffer.length} bytes)`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Generate invoice error details:", error);
      
      res.status(500).json({ 
        message: "Failed to generate invoice",
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Helper function for text invoice fallback
  function generateTextInvoice(order: any, orderItems: any[], isAdminCopy: boolean = false): string {
    let invoice = "=".repeat(60) + "\n";
    invoice += "JEWEL HAVEN INVOICE\n";
    invoice += "=".repeat(60) + "\n";
    invoice += `${isAdminCopy ? "ADMIN COPY" : "CUSTOMER COPY"}\n\n`;
    
    invoice += `Invoice Number: ${order.orderNumber}\n`;
    invoice += `Date: ${new Date(order.createdAt).toLocaleDateString()}\n`;
    invoice += `Customer: ${order.deliveryName || 'N/A'}\n`;
    invoice += `Phone: ${order.deliveryPhone || 'N/A'}\n`;
    invoice += `Address: ${order.deliveryAddress || 'N/A'}\n\n`;
    
    invoice += "-".repeat(60) + "\n";
    invoice += "ORDER ITEMS:\n";
    invoice += "-".repeat(60) + "\n";
    
    let totalAmount = 0;
    for (const item of orderItems) {
      const itemTotal = parseFloat(item.price || 0) * (item.quantity || 1);
      totalAmount += itemTotal;
      invoice += `${item.productName || 'Product'}\n`;
      invoice += `  Price: KSh ${parseFloat(item.price || 0).toLocaleString()}\n`;
      invoice += `  Quantity: ${item.quantity || 1}\n`;
      invoice += `  Total: KSh ${itemTotal.toLocaleString()}\n\n`;
    }
    
    invoice += "-".repeat(60) + "\n";
    invoice += "SUMMARY:\n";
    invoice += "-".repeat(60) + "\n";
    invoice += `Subtotal: KSh ${parseFloat(order.subtotal || 0).toLocaleString()}\n`;
    invoice += `Delivery Fee: KSh ${parseFloat(order.deliveryFee || 0).toLocaleString()}\n`;
    invoice += `Total: KSh ${parseFloat(order.total || 0).toLocaleString()}\n\n`;
    
    invoice += `Payment Method: ${order.paymentMethod || 'N/A'}\n`;
    invoice += `Payment Status: ${order.paymentStatus || 'N/A'}\n`;
    if (order.mpesaReceiptNumber) {
      invoice += `M-Pesa Receipt: ${order.mpesaReceiptNumber}\n`;
    }
    
    invoice += "\n" + "=".repeat(60) + "\n";
    invoice += "Thank you for shopping with Jewel Haven!\n";
    invoice += "=".repeat(60) + "\n";
    
    return invoice;
  }

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { search, category, price, sort, page, limit, featured } =
        req.query;

      let priceMin, priceMax;
      if (price && price !== "all") {
        const priceStr = price as string;
        if (priceStr.endsWith("+")) {
          priceMin = parseInt(priceStr.replace("+", ""));
        } else {
          const [min, max] = priceStr.split("-").map(Number);
          priceMin = min;
          priceMax = max;
        }
      }

      const result = await storage.getProducts({
        search: search as string,
        category: category as string,
        priceMin,
        priceMax,
        sort: sort as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 12,
        featured: featured === "true",
      });

      res.json(result);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      console.error("Get featured products error:", error);
      res.status(500).json({ message: "Failed to get featured products" });
    }
  });

  app.get("/api/products/latest", async (req, res) => {
    try {
      const products = await storage.getLatestProducts();
      res.json(products);
    } catch (error) {
      console.error("Get latest products error:", error);
      res.status(500).json({ message: "Failed to get latest products" });
    }
  });

  app.get("/api/products/related/:id", async (req, res) => {
    try {
      const product = await storage.getProductById(parseInt(req.params.id));
      if (!product) {
        return res.json([]);
      }
      const related = await storage.getRelatedProducts(
        product.id,
        product.category,
      );
      res.json(related);
    } catch (error) {
      console.error("Get related products error:", error);
      res.status(500).json({ message: "Failed to get related products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductById(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ message: "Failed to get product" });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      items,
      deliveryName,
      deliveryPhone,
      deliveryAddress,
      notes,
      paymentMethod,
      subtotal,
      deliveryFee,
      total,
    } = req.body;

    const orderNumber = generateOrderNumber();

    // For COD orders, set initial status as pending (stock not updated yet)
    // For M-Pesa orders, set initial status as pending (will update when payment completes)
    const order = await storage.createOrder({
      userId: auth.userId,
      orderNumber,
      status: "pending",
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      subtotal,
      deliveryFee,
      total,
      deliveryAddress,
      deliveryPhone,
      deliveryName,
      notes,
    });

    for (const item of items) {
      const product = await storage.getProductById(item.productId);
      if (product) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: product.name,
          productImage: product.image,
          price: item.price,
          quantity: item.quantity,
        });
      }
    }

    res.json(order);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
});

  // M-Pesa payment routes
  app.post("/api/payments/mpesa/stkpush", async (req, res) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { orderId, phoneNumber, amount } = req.body;

    console.log("Received M-Pesa request:", { orderId, phoneNumber, amount, rawBody: req.body }); // Debug log

    // Validate required fields
    if (!phoneNumber || !amount) {
      return res.status(400).json({ 
        message: "Phone number and amount are required",
        received: { phoneNumber, amount }
      });
    }

    // Format phone number
    let formattedPhone = String(phoneNumber).trim();
    
    // Remove any non-digit characters first (except plus sign for now)
    formattedPhone = formattedPhone.replace(/[^\d+]/g, '');
    
    // Remove plus sign if present
    formattedPhone = formattedPhone.replace(/\+/g, '');
    
    // If phone starts with 0, convert to 254
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    // If phone starts with 7 (Kenyan number without country code), add 254
    else if (formattedPhone.startsWith('7') && formattedPhone.length === 9) {
      formattedPhone = '254' + formattedPhone;
    }
    // Ensure it starts with 254
    else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    // Parse and validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ 
        message: "Invalid amount",
        amount: amount 
      });
    }

    // Round up to nearest whole number (M-Pesa requires integers)
    const roundedAmount = Math.ceil(amountNum);

    console.log("Formatted for M-Pesa API:", { 
      phoneNumber: formattedPhone, 
      amount: roundedAmount 
    });

    // Make request to M-Pesa API
    const mpesaResponse = await fetch(
      `${MPESA_API_URL}/api/payJewelHaven.php`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          amount: roundedAmount.toString(), // Ensure it's a string
        }),
      }
    );

    console.log("M-Pesa API response status:", mpesaResponse.status);

    const resultText = await mpesaResponse.text();
    console.log("M-Pesa API raw response:", resultText);

    let result;
    try {
      result = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Failed to parse M-Pesa response:", parseError);
      return res.status(502).json({ 
        message: "Invalid response from M-Pesa API",
        rawResponse: resultText 
      });
    }

    console.log("M-Pesa API parsed response:", result);

    if (result.success && result.CheckoutRequestID) {
      await storage.updateOrder(orderId, {
        mpesaCheckoutId: result.CheckoutRequestID,
      });
      console.log("Updated order with CheckoutRequestID:", result.CheckoutRequestID);
    }

    res.json(result);
  } catch (error) {
    console.error("M-Pesa initiate error details:", error);
    res.status(500).json({ 
      message: "Failed to initiate payment",
      error: error.message 
    });
  }
});

  
app.post("/api/payments/mpesa/callback", async (req, res) => {
  try {
    const { checkoutRequestId } = req.body;

    console.log("Verifying payment for checkoutRequestId:", checkoutRequestId);

    const response = await fetch(
      `${MPESA_API_URL}/api/verify-transaction.php`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutRequestId,
        }),
      }
    );

    const mpesaResult = await response.json();

    console.log("M-Pesa API direct response:", JSON.stringify(mpesaResult, null, 2));

    // Return the M-Pesa response DIRECTLY without wrapping it
    // Your M-Pesa API returns: {success: true, status: "completed", data: {...}} for success
    // Or: {success: false, status: "pending", data: {...}} for pending
    
    // Check if payment is successful
    if (mpesaResult.success === true && mpesaResult.status === "completed") {
      const mpesaData = mpesaResult.data;
      
      if (mpesaData?.ResultCode === 0 && mpesaData?.MpesaReceiptNumber) {
        const orders = await storage.getAllOrders();
        const order = orders.find(
          (o) => o.mpesaCheckoutId === checkoutRequestId,
        );

        if (order) {
          // Update order status to processing and payment status to paid
          await storage.updateOrder(order.id, {
            paymentStatus: "paid",
            mpesaReceiptNumber: mpesaData.MpesaReceiptNumber,
            status: "processing",
          });

          // Update product stock quantities
          await updateProductStock(order.id);
          
          console.log(`Order ${order.id} updated successfully. Receipt: ${mpesaData.MpesaReceiptNumber}`);
        }
      }
    }

    // Return the M-Pesa result AS-IS to the frontend
    // The frontend will check mpesaResult.success and mpesaResult.status
    res.json(mpesaResult);
    
  } catch (error) {
    console.error("M-Pesa verify error:", error);
    // Return error in same format as M-Pesa API
    res.status(500).json({
      success: false,
      status: "error",
      data: {
        message: "Failed to verify payment",
        error: error.message
      }
    });
  }
});


  // Admin routes
  app.get("/api/admin/dashboard", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth || !(await isAdmin(auth.userId))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const [
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        recentOrders,
      ] = await Promise.all([
        storage.getProductCount(),
        storage.getOrderCount(),
        storage.getUserCount(),
        storage.getTotalRevenue(),
        storage.getRecentOrders(5),
      ]);

      res.json({
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        recentOrders,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to get dashboard data" });
    }
  });

 
  app.get("/api/admin/products", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth || !(await isAdmin(auth.userId))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Get admin products error:", error);
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  app.post("/api/admin/products", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth || !(await isAdmin(auth.userId))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      console.log('Received product creation request:', req.body);

      const { image, ...productData } = req.body;

      // Validate image size
      if (image && image.startsWith("data:image/")) {
        const base64Size = (image.length * 3) / 4;
        if (base64Size > 10 * 1024 * 1024) {
          // 10MB limit for base64
          return res.status(413).json({
            message: "Image too large. Please use an image under 7MB.",
          });
        }
      }

      // Convert all string numbers to actual numbers
      const processedData: any = {
        ...productData,
        image: image || null,
      };

      // Convert numeric fields
      if (productData.price) {
        processedData.price = parseFloat(productData.price);
      }
      if (productData.originalPrice) {
        processedData.originalPrice = parseFloat(productData.originalPrice);
      }
      if (productData.stockQuantity) {
        processedData.stockQuantity = parseInt(productData.stockQuantity);
      }
      if (productData.deliveryFee) {
        processedData.deliveryFee = parseFloat(productData.deliveryFee);
      }

      console.log('Processed data for storage:', processedData);

      const product = await storage.createProduct(processedData);
      res.json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth || !(await isAdmin(auth.userId))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { image, ...productData } = req.body;

      // Validate image size
      if (image && image.startsWith("data:image/")) {
        const base64Size = (image.length * 3) / 4;
        if (base64Size > 10 * 1024 * 1024) {
          // 10MB limit for base64
          return res.status(413).json({
            message: "Image too large. Please use an image under 7MB.",
          });
        }
      }

      // Convert numeric fields
      const processedData: any = { ...productData };
      
      if (productData.price) {
        processedData.price = parseFloat(productData.price);
      }
      if (productData.originalPrice) {
        processedData.originalPrice = parseFloat(productData.originalPrice);
      }
      if (productData.stockQuantity !== undefined) {
        processedData.stockQuantity = parseInt(productData.stockQuantity);
      }
      if (productData.deliveryFee) {
        processedData.deliveryFee = parseFloat(productData.deliveryFee);
      }

      if (image !== undefined) {
        processedData.image = image;
      }

      const product = await storage.updateProduct(parseInt(req.params.id), processedData);
      res.json(product);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth || !(await isAdmin(auth.userId))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteProduct(parseInt(req.params.id));
      res.json({ message: "Product deleted" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.get("/api/admin/orders", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth || !(await isAdmin(auth.userId))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const orders = await storage.getAllOrders();
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return { ...order, items };
        }),
      );
      res.json(ordersWithItems);
    } catch (error) {
      console.error("Get admin orders error:", error);
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  
app.patch("/api/admin/orders/:id/status", async (req, res) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth || !(await isAdmin(auth.userId))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { status } = req.body;
    const order = await storage.updateOrder(parseInt(req.params.id), {
      status,
    });

    // If order is being delivered and payment method is COD, update payment status
    if (status === "delivered" && order.paymentMethod === "cod") {
      await storage.updateOrder(parseInt(req.params.id), {
        paymentStatus: "paid",
      });
      // Update product stock for COD orders when delivered
      await updateProductStock(order.id);
    }

    // If order is being processed and payment is M-Pesa, update stock
    if (status === "processing" && order.paymentMethod === "mpesa" && order.paymentStatus === "paid") {
      await updateProductStock(order.id);
    }

    res.json(order);
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

  app.get("/api/admin/users", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth || !(await isAdmin(auth.userId))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.patch("/api/admin/users/:id/role", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      const currentUser = await storage.getUserById(auth?.userId || 0);

      if (!currentUser || currentUser.role !== "superadmin") {
        return res
          .status(403)
          .json({ message: "Only super admin can change roles" });
      }

      const { role } = req.body;
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.updateUser(parseInt(req.params.id), { role });
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Update user details (admin only)
  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const auth = await authenticateRequest(req);
      if (!auth || !(await isAdmin(auth.userId))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const userId = parseInt(req.params.id);
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent editing super admin
      if (user.role === "superadmin") {
        return res.status(403).json({ message: "Cannot edit super admin" });
      }

      const { name, email, phone, isVerified } = req.body;
      
      // Validate email if changed
      if (email && email !== user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      const updatedUser = await storage.updateUser(userId, {
        name,
        email,
        phone,
        isVerified
      });

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });




app.post("/api/contact", async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);
    
    // Get user ID if logged in
    let userId: number | undefined;
    const auth = await authenticateRequest(req);
    if (auth) {
      userId = auth.userId;
    }
    
    const contact = await storage.createContact({
      ...data,
      userId: userId || null,
      status: "new",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.json({ 
      message: "Message sent successfully", 
      success: true,
      data: contact
    });
  } catch (error) {
    console.error("Contact error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Get user's contact messages (requires auth)
app.get("/api/user/contacts", async (req, res) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUserById(auth.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's contacts and replies
    const contacts = await storage.getContacts(auth.userId);
    const contactsWithReplies = await Promise.all(
      contacts.map(async (contact) => {
        const replies = await storage.getContactReplies(contact.id);
        return { ...contact, replies };
      })
    );

    res.json(contactsWithReplies);
  } catch (error) {
    console.error("Get user contacts error:", error);
    res.status(500).json({ message: "Failed to get contact messages" });
  }
});


// Get contact messages by email (for non-logged in users)
app.get("/api/contact/messages", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: "Valid email is required" });
    }

    // Use the new method to get contacts by email
    const userContacts = await storage.getContactsByEmail(email);
    
    const contactsWithReplies = await Promise.all(
      userContacts.map(async (contact) => {
        const replies = await storage.getContactReplies(contact.id);
        return { ...contact, replies };
      })
    );

    res.json(contactsWithReplies);
  } catch (error) {
    console.error("Get contact messages by email error:", error);
    res.status(500).json({ message: "Failed to get contact messages" });
  }
});

// Admin contact routes
app.get("/api/admin/contacts", async (req, res) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth || !(await isAdmin(auth.userId))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const contacts = await storage.getAdminContacts();
    const contactsWithReplies = await Promise.all(
      contacts.map(async (contact) => {
        const replies = await storage.getContactReplies(contact.id);
        return { ...contact, replies };
      })
    );

    res.json(contactsWithReplies);
  } catch (error) {
    console.error("Get admin contacts error:", error);
    res.status(500).json({ message: "Failed to get contact messages" });
  }
});

// Update contact message status
app.patch("/api/admin/contacts/:id", async (req, res) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth || !(await isAdmin(auth.userId))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { status } = req.body;
    const contactId = parseInt(req.params.id);
    
    const contact = await storage.updateContact(contactId, { 
      status,
      updatedAt: new Date()
    });
    
    res.json({ 
      success: true, 
      message: "Contact message status updated",
      data: contact
    });
  } catch (error) {
    console.error("Update contact error:", error);
    res.status(500).json({ message: "Failed to update contact message" });
  }
});

// Admin reply to contact message
app.post("/api/admin/contacts/:id/reply", async (req, res) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth || !(await isAdmin(auth.userId))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const admin = await storage.getUserById(auth.userId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const contactId = parseInt(req.params.id);
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    // Create reply
    const reply = await storage.createContactReply({
      contactId,
      adminId: admin.id,
      adminName: admin.name,
      message,
      createdAt: new Date()
    });

    // Update contact status to replied
    await storage.updateContact(contactId, { 
      status: "replied",
      updatedAt: new Date()
    });

    res.json({ 
      success: true, 
      message: "Reply sent successfully",
      data: reply
    });
  } catch (error) {
    console.error("Reply to contact error:", error);
    res.status(500).json({ message: "Failed to send reply" });
  }
});

// Delete contact message (admin only)
app.delete("/api/admin/contacts/:id", async (req, res) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth || !(await isAdmin(auth.userId))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const contactId = parseInt(req.params.id);
    await storage.deleteContact(contactId);
    
    res.json({ 
      success: true, 
      message: "Contact message deleted"
    });
  } catch (error) {
    console.error("Delete contact error:", error);
    res.status(500).json({ message: "Failed to delete contact message" });
  }
});
}
