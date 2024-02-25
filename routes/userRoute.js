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

// userRoute.get("/otp-verification",controller.loadOTP)
userRoute.get("/load-otp",controller.loadOTP)
userRoute.post("/resend-otp",controller.resendOTP)
userRoute.post("/otp-verification",controller.verifyOTP)
  
userRoute.get("/login",controller.loadLogin)
userRoute.post("/login",controller.verifyLogin) 

userRoute.get("/products",controller.loadProductList)
userRoute.get("/men",controller.loadMen) 
userRoute.get("/women",controller.loadWomen)
userRoute.get("/kids",controller.loadKids)
userRoute.get("/product-details",controller.loadProductDetails)

userRoute.get("/logout", controller.userLogout);  

 
//================ My account ===================   

userRoute.get("/account",auth.isLogin,controller.myAccount)  
userRoute.post("/edit-user",controller.editUser)
userRoute.post("/address",controller.addAddress)
userRoute.get("/edit-address/:id",controller.loadEditAddress)
userRoute.post("/edit-address",controller.editAddress)
userRoute.post("/delete-address",controller.deleteAddress)
  
//===================== Cart=====================

userRoute.post('/add-to-cart',controller.addTocart)
userRoute.get("/cart",auth.isLogin,controller.loadCart)
userRoute.post("/update-cart",auth.isLogin,controller.updateCart)
userRoute.post("/remove-item",auth.isLogin,controller.removeItem)

//===================== Checkout ================

userRoute.get('/checkout',controller.loadCheckout)
userRoute.get("/order",controller.loadOrderSuccess)
userRoute.post("/order",controller.order) 
 
 
  


module.exports = userRoute       
   