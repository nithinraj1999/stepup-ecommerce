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

userRoute.get("/products",controller.loadProductList)
userRoute.get("/men",controller.loadMen)
userRoute.get("/women",controller.loadWomen)
userRoute.get("/kids",controller.loadKids)

userRoute.get("/product-details",controller.loadProductDetails)
    


module.exports = userRoute