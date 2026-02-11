import express from "express";
import dotenv from "dotenv";
   

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
import pool from "./configs/db.js";
import productRoutes from "./routes/product.route.js";

dotenv.config();
const app = express();
const port = process.env.SERVER_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', productRoutes);

app.get("/", (req, res) => {
 res.send("Sujal Patel");
});

// Register routes

app.listen(port, ()=>{
      console.log(`Server is running on http://localhost:${port}`);
});