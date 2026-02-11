import express from "express";
import dotenv from "dotenv";
      payments: "/api/payments",
      // products: "/api/products",
      // categories: "/api/categories",
      // cart: "/api/cart",
      // orders: "/api/orders",
    },
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);

// Add more routes here as you create them:
// app.use("/api/products", productRoutes);
// app.use("/api/categories", categoryRoutes);
// app.use("/api/cart", cartRoutes);
// app.use("/api/orders", orderRoutes);

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
  console.log(`  - Payments: http://localhost:${port}/api/payments`);
// app.get("/", (req, res) => {
//   res.send("Om prajapati");
// });

app.use("/api/user", userRoute);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
