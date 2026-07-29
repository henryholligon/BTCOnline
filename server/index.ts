import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { seed } from "./seed";
import { startSheetSyncPoller } from "./sheetSync";
import { db } from "./db";
import { sql } from "drizzle-orm";

// Augment the express-session type so TypeScript knows about our custom field.
declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    userEmail?: string; // set on custodial email login; used by GET /api/auth/session
  }
}

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Session middleware — used to track admin authentication.
// The session is established when the admin navigates to the secret admin URL.
app.use(
  session({
    secret: process.env.SESSION_SECRET || "btconline-dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  }),
);

// Grant an admin session to anyone who navigates directly to the secret admin URL.
// This keeps the auth model consistent with the existing "URL = identity" approach
// while adding a server-enforceable gate on privileged endpoints.
app.use((req, _res, next) => {
  if (req.path === "/x7k2m9p4r1qn" || req.path.startsWith("/x7k2m9p4r1qn/")) {
    req.session.isAdmin = true;
  }
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sheet_sync_config (
      id SERIAL PRIMARY KEY,
      csv_url TEXT NOT NULL DEFAULT '',
      enabled BOOLEAN NOT NULL DEFAULT false,
      last_sync_at TEXT,
      last_sync_status TEXT,
      last_sync_count INTEGER
    )
  `);
  await db.execute(sql`
    ALTER TABLE merchants ADD COLUMN IF NOT EXISTS nostr_event_id TEXT
  `);
  await db.execute(sql`
    ALTER TABLE sheet_sync_config ADD COLUMN IF NOT EXISTS emoji_csv_url TEXT NOT NULL DEFAULT ''
  `);
  await db.execute(sql`
    ALTER TABLE sheet_sync_config ADD COLUMN IF NOT EXISTS country_emoji_csv_url TEXT NOT NULL DEFAULT ''
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
       email TEXT UNIQUE,
       password_hash TEXT,
      pubkey TEXT NOT NULL,
       encrypted_nsec TEXT,
      salt TEXT NOT NULL,
       iv TEXT,
      created_at TEXT NOT NULL DEFAULT ''
    )
  `);
  // Make salt nullable — custodial users have no client-side salt.
  await db.execute(sql`ALTER TABLE users ALTER COLUMN salt DROP NOT NULL`);
  await db.execute(sql`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`);
  await db.execute(sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`);
  await db.execute(sql`ALTER TABLE users ALTER COLUMN encrypted_nsec DROP NOT NULL`);
  await db.execute(sql`ALTER TABLE users ALTER COLUMN iv DROP NOT NULL`);
  // Email accounts are custodial. Pure Nostr accounts are not stored in users.
  await db.execute(sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS key_custody TEXT NOT NULL DEFAULT 'custodial'
  `);
  // Password reset token (SHA-256 hash) and its expiry.
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TEXT`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS key_salt TEXT`);
  await seed();
  await registerRoutes(httpServer, app);
  startSheetSyncPoller();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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
    },
  );
})();
