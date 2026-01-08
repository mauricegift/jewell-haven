import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import 'dotenv/config';

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ⭐⭐⭐ STRICT DOMAIN CONFIGURATION ⭐⭐⭐
const ALLOWED_DOMAIN = "https://jwl.giftedtech.co.ke";
const ALLOWED_ORIGIN = "https://jwl.giftedtech.co.ke";

// ⭐⭐⭐ SECURITY: Use cors package with PROPER configuration ⭐⭐⭐
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like direct browser visits, mobile apps, curl)
    // This is important for serving the frontend itself!
    if (!origin) {
      return callback(null, true);
    }
    
    // In production, STRICTLY only allow our domain for cross-origin requests
    if (origin === ALLOWED_ORIGIN) {
      callback(null, true);
    } else {
      // Log unauthorized origin attempts
      log(`CORS blocked: Invalid origin '${origin}'`, "security");
      callback(new Error(`Not allowed by CORS. Only ${ALLOWED_ORIGIN} is allowed.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// ⭐⭐⭐ CRITICAL FIX: Increase request size limits for image uploads ⭐⭐⭐
app.use(
  express.json({
    limit: '50mb', // Increased from default 100kb to 50MB
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ 
  limit: '50mb', // Increased from default 100kb to 50MB
  extended: false 
}));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// ⭐⭐⭐ SECURITY HEADERS MIDDLEWARE ⭐⭐⭐
app.use((req: Request, res: Response, next: NextFunction) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  if (process.env.NODE_ENV === "production") {
    res.setHeader('Content-Security-Policy', 
      "default-src 'self' https://jwl.giftedtech.co.ke; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self' https://jwl.giftedtech.co.ke; " +
      "frame-ancestors 'none';"
    );
  }
  
  next();
});

// ⭐⭐⭐ STRICT API ORIGIN VALIDATION MIDDLEWARE ⭐⭐⭐
// This only applies to API requests, not static files or the app itself
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const path = req.path;
  const method = req.method;
  
  // Skip for:
  // 1. Static files (js, css, images, etc.)
  // 2. The main app (non-API routes)
  // 3. Health checks
  // 4. OPTIONS preflight requests (handled by CORS)
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/assets/') ||
    path.endsWith('.js') ||
    path.endsWith('.css') ||
    path.endsWith('.ico') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.svg') ||
    path === '/' ||
    path === '/health' ||
    path === '/api/health' ||
    method === 'OPTIONS'
  ) {
    return next();
  }
  
  // ⭐⭐⭐ STRICT VALIDATION ONLY FOR API ENDPOINTS ⭐⭐⭐
  if (path.startsWith('/api/')) {
    // In production, require proper origin for non-GET API requests
    if (process.env.NODE_ENV === 'production') {
      // For POST, PUT, PATCH, DELETE API requests - require strict validation
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const hasValidOrigin = origin === ALLOWED_ORIGIN;
        const hasValidReferer = referer && referer.startsWith(ALLOWED_DOMAIN);
        
        if (!hasValidOrigin && !hasValidReferer) {
          log(`Blocked API ${method}: Invalid origin/referer for ${path}`, "security");
          return res.status(403).json({
            message: "Access forbidden. This API only accepts requests from https://jwl.giftedtech.co.ke",
            code: "STRICT_ORIGIN_REQUIRED",
            help: "Make sure your request includes the Origin header or Referer header from the correct domain"
          });
        }
      }
    }
  }
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Handle CORS errors specifically
    if (err.message.includes('CORS')) {
      return res.status(403).json({
        message: "Access forbidden. Cross-origin requests are only allowed from https://jwl.giftedtech.co.ke",
        code: "CORS_ERROR",
        allowedDomain: ALLOWED_DOMAIN
      });
    }
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      log(`STRICT SECURITY ENABLED for ${ALLOWED_DOMAIN}`, "security");
      log(`API Protection: Strict origin validation for modifying requests (POST/PUT/PATCH/DELETE)`, "security");
      log(`App Access: Direct visits allowed (no Origin header required)`, "security");
      
      if (process.env.NODE_ENV === "development") {
        log("⚠️  WARNING: Running in development mode", "security-warning");
      }
    },
  );
})();