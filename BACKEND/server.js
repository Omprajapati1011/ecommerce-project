import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import categoryRoutes from "./routes/category.routes.js";
// Import Routes
import paymentRoutes from "./routes/payments.route.js";
import userRoute from "./routes/User.route.js";
import portionRouter from "./routes/portion.route.js";
import orderRouter from "./routes/order_master.route.js";
import orderItemRouter from "./routes/Order_item.route.js";
import cartRouter from "./routes/cart.route.js";
import { route as offerRoute } from "./routes/offer.route.js";
import reviewRouter from "./routes/review.routes.js";
import modifierRoute from "./routes/modifier.route.js";
import productRoutes from "./routes/product.route.js";
import productImageRoutes from "./routes/productImage.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import settingsRoutes from "./routes/settings.route.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
    ],
    credentials: true,
  }),
);
const port = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE
// ============================================================================
// Enable CORS for frontend requests

// Parse JSON request bodies (skip for Stripe webhook - it needs raw body)
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// ROUTES
// ============================================================================

//  Welcome route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "E-Commerce Accrete API is running",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      payments: "/api/payments",
      modifiers: "/api/modifiers",
      cart: "/api/cart",
      products: "/api/products",
      category: "/api/category",
      offer: "/api/offer",
      review: "/api/review",
    },
  });
});
app.use("/api/order", orderRouter);
app.use("/api/order-item", orderItemRouter);

// API Routes
app.use("/api/users", userRoute);
app.use("/api/payments", paymentRoutes);
app.use("/api/portion", portionRouter);
app.use("/api/review", reviewRouter);
app.use("/api/cart", cartRouter);

// app.use("/api/offer", offerRoute);
app.use("/api/modifiers", modifierRoute);
app.use("/api/category", categoryRoutes);
app.use("/api/offer", offerRoute);
app.use("/api/products", productRoutes);
app.use("/api/productImages", productImageRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 Handler - Route not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`API Endpoints:`);
  console.log(`  - Users: http://localhost:${port}/api/users`);
  console.log(`  - Cart: http://localhost:${port}/api/cart`);
  console.log(`  - Payments: http://localhost:${port}/api/payments`);
  console.log(`  - Portion: http://localhost:${port}/api/portion`);
  console.log(`  - Review: http://localhost:${port}/api/review`);
  console.log(`  - Offer: http://localhost:${port}/api/offer`);
  console.log(`  - Portion: http://localhost:${port}/api/products`);
  console.log(`  - Order: http://localhost:${port}/api/order`);
  console.log(`  - Order: http://localhost:${port}/api/category`);
});
