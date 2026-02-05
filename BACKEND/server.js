<<<<<<<<< Temporary merge branch 1
//devang
//hihi
=========
import express from "express"
import dotenv from "dotenv"

dotenv.config();

const app = express();

const Port = process.env.PORT;


app.listen(Port,()=>{
    console.log(`Server is running on http://localhost:${Port}`);
})
