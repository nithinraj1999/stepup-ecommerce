const express = require("express");
const controller = require("../Controller/userController")
const bodyParser = require("body-parser")
const userRoute = express();
const session = require("express-session")
const nocache = require("nocache");
userRoute.use(
    session({
      secret:"mysitesessionsecret",
      resave: false,
      saveUninitialized: true,
    })
  ); 

const auth = require("../middleware/auth");
userRoute.use(nocache());


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
userRoute.get("/logout", controller.userLogout); 

userRoute.post('/add-to-cart',controller.addTocart)
userRoute.get("/cart",auth.isLogin,controller.loadCart)

//================ My account ===========

userRoute.get("/account",auth.isLogin,controller.myAccount)  
userRoute.post("/address",controller.addAddress)
userRoute.get("/edit-address/:id",controller.loadEditAddress)
userRoute.post("/edit-address",controller.editAddress)
userRoute.post("/delete-address",controller.deleteAddress)
  
module.exports = userRoute     
 