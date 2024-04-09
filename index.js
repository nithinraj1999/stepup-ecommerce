const express = require("express");
const multer  =require("multer")
const path = require("path")
const app = express();
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://vnithinraj99:DDzgIwdJOSOfkzSQ@cluster0.izvom4q.mongodb.net/dummy");


const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");



app.set("view engine", "ejs");


app.use(express.static(__dirname + "/Views"));
app.use(express.static(__dirname + "/public"));


app.use("/",userRoute);
app.use("/admin",adminRoute);

app.listen(3000, () => console.log("Running....http://localhost:3000"));
    