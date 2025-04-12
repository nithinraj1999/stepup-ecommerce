const express = require("express");
const path = require("path")
const app = express();
require('dotenv').config()
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
 

const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + "/public"));

app.use("/",userRoute);
app.use("/admin",adminRoute);

app.listen(process.env.PORT, () => console.log(`Running....http://localhost:${process.env.PORT}`)); 
