import express from "express";
import dotenv from "dotenv";
import pool from "./configs/db.js";
import cartRouter from "./routes/cart.route.js";
import userRouter from "./routes/user.route.js";

dotenv.config();
const app = express();
const port = process.env.SERVER_PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cart APIs
app.use("/api/cart", cartRouter);

// User Authentication and Profile APIs
app.use("/api", userRouter);

app.listen(port, ()=>{
      console.log(`Server is running on http://localhost:${port}`);
});
