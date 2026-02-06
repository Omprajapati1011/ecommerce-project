import express from "express";
import dotenv from "dotenv";
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