import express from "express";
import dotenv from "dotenv";
import pool from "./configs/db.js";

dotenv.config();
const app = express();
const port = process.env.SERVER_PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", (req, res) => {
 res.send("Om prajapati");
});

app.listen(port, ()=>{
      console.log(`Server is running on http://localhost:${port}`);
});