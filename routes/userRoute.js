const express = require("express");
const controller = require("../Controller/userController")
const bodyParser = require("body-parser")
const userRoute = express();

userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({ extended: true }));

userRoute.get("/",controller.loadHomePage)
userRoute.get("/signup",controller.loadsignup)
userRoute.post("/signup",controller.signup)
userRoute.get("/otp-verification",controller.loadOTP)
userRoute.post("/otp-verification",controller.verifyOTP)

userRoute.get("/login",controller.loadLogin)
userRoute.post("/login",controller.verifyLogin)

  


module.exports = userRoute