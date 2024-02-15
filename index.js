const express = require("express");
const multer  =require("multer")

const app = express();
const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/dummy");
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");



app.set("view engine", "ejs");

app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + "/public"));

app.use("/",userRoute);
app.use("/admin",adminRoute);

app.listen(3000, () => console.log("Running....http://localhost:3000"));
