import express from "express";
import dotenv from "dotenv";
import pool from "./configs/db.js";
import userRoute from "./routes/User.route.js";

dotenv.config();
const app = express();
const port = process.env.SERVER_PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.get("/", (req, res) => {
//   res.send("Om prajapati");
// });

app.use("/api/user",userRoute);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
