import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import diligenceRoutes from "./routes/diligence.js";

import authRoutes from "./routes/auth.js";
import capitalSeekerRoutes from "./routes/capitalSeeker.js";
import listingRoutes from "./routes/listing.js";
import investorRoutes from "./routes/investor.js";
import interestRoutes from "./routes/interest.js";
import documentRoutes from "./routes/document.js";
import updateRoutes from "./routes/update.js";
import adminRoutes from "./routes/admin.js";
import scoreRoutes from "./routes/score.js";
import connectionRoutes from "./routes/connection.js";
import messageRoutes from "./routes/message.js";
import notificationRoutes from "./routes/notification.js";
import activityRoutes from "./routes/activity.js";
import { errorHandler } from "./middleware/errorHandler.js";
import userRoutes from "./routes/user.js";
import compression from "compression";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  }),
);

app.use(compression());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Temporary during local storage.
// Remove this after Cloudinary migration.
// All downloads will then go through authenticated API routes.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts. Try again in 15 minutes.",
  },
});
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Upload limit reached. Try again later.",
  },
});

app.use("/api", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/document", uploadLimiter);

// Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "KuberList API",
      version: "1.0.0",
      description: "Capital Discovery Marketplace — Phase 1 MVP",
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3001}/api` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
});
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { customSiteTitle: "KuberList API Docs" }),
);
app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));

app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date() }),
);

app.use("/api/auth", authRoutes);
app.use("/api/capital-seeker", capitalSeekerRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/investor", investorRoutes);
app.use("/api/interest", interestRoutes);
app.use("/api/document", documentRoutes);
app.use("/api/update", updateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/diligence", diligenceRoutes);
app.use("/api/user", userRoutes);
app.use((req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route ${req.path} not found` }),
);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 KuberList API  → http://localhost:${PORT}`);
  console.log(`📖 Swagger Docs   → http://localhost:${PORT}/api/docs\n`);
});
