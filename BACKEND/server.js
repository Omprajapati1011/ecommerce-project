import express from "express";
import dotenv from "dotenv";
import pool from "./configs/db.js"; // ES Module import
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";

dotenv.config();

const app = express();
const port = 5500;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);

app.get("/", (req, res) => {
  res.send("Bhautik sanepara");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
