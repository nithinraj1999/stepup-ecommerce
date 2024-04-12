const express = require("express");
const controller = require("../Controller/userController")
const bodyParser = require("body-parser")
const userRoute = express();
const session = require("express-session")
const nocache = require("nocache");
const coupenModal = require("../Models/coupenModel")
var flash = require('connect-flash');

userRoute.set("views","views/user")

userRoute.use(
    session({ 
      secret:"mysitesessionsecret",
      resave: false,
      saveUninitialized: true,
    })
); 

userRoute.use(flash());

const auth = require("../middleware/auth");
userRoute.use(nocache());


userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({ extended: true }));

userRoute.get("/",auth.isBlocked,controller.loadHomePage)
userRoute.get("/signup",controller.loadsignup)
userRoute.post("/signup",controller.signup) 

userRoute.get("/load-otp",controller.loadOTP)
userRoute.post("/resend-otp",controller.resendOTP)
userRoute.post("/otp-verification",controller.verifyOTP)
  
userRoute.get("/login",controller.loadLogin)
userRoute.post("/login",controller.verifyLogin) 
userRoute.get("/logout", controller.userLogout)

//=============== Product list =================

userRoute.get("/products",auth.isBlocked,controller.loadProductList)
userRoute.get("/men",auth.isBlocked,controller.loadMen) 
userRoute.get("/women",auth.isBlocked,controller.loadWomen)
userRoute.get("/kids",auth.isBlocked,controller.loadKids) 
userRoute.get("/product-details",auth.isBlocked,controller.loadProductDetails)
 
//================ My account ===================   
 



userRoute.get("/account",auth.isBlocked,auth.isLogin,controller.myAccount)  

userRoute.post("/edit-user",auth.isBlocked,controller.editUser) 
userRoute.post("/address",auth.isBlocked,controller.addAddress)
userRoute.get("/edit-address/:id",auth.isBlocked,controller.loadEditAddress)
userRoute.post("/edit-address",auth.isBlocked,controller.editAddress)
userRoute.post("/delete-address",auth.isBlocked,controller.deleteAddress)

userRoute.get("/wallet",auth.isBlocked,auth.isLogin,controller.loadWallet)  

//===================== Cart=====================

userRoute.post('/add-to-cart',controller.addTocart)
userRoute.get("/cart",auth.isBlocked,auth.isLogin,controller.loadCart)
userRoute.post("/update-cart",auth.isLogin,controller.updateCart)
userRoute.post("/remove-item",auth.isLogin,controller.removeItem)

//===================== Checkout ================
 
userRoute.get('/checkout',auth.isBlocked,controller.loadCheckout)
userRoute.get('/checkout-verification',controller.checkOutVerification)

//===================== orders ==================

userRoute.get("/order",auth.isBlocked,controller.loadOrderSuccess) 
userRoute.post("/order",controller.order)
userRoute.get("/order-invoice",controller.loadInvoice)
userRoute.get("/order-details",auth.isBlocked,auth.isLogin,controller.orderDetails) 
userRoute.post("/order-cancelation",controller.cancelRequest)
userRoute.post("/request-return",controller.returnRequest)

//================== Razorpayment ==================
 
userRoute.post("/verify-payment",controller.verifyPayment)
userRoute.post("/failed-payment",controller.failedPayment)
userRoute.get("/paymen-failed",auth.isBlocked,controller.paymentFailed)
userRoute.post("/retry-payment", controller.retryPayment);
//===================== wishList =================

userRoute.post("/wish-list",controller.addToWishList)
userRoute.get("/my-wish-list",auth.isBlocked,controller.loadWishList)
userRoute.post("/remove-from-wishlist",controller.removeWishList) 

//====================== coupens =================

userRoute.post("/apply-coupen",controller.applyCoupen)

//=================== forgot password ============

userRoute.get("/reset-password",controller.loadEmailSubmit)
userRoute.post("/reset-password",controller.sendResetLink)
userRoute.get("/reset",controller.loadResetPassword)
userRoute.post("/reset",controller.resetPassword)
userRoute.get("/send-reset-email",controller.sendResetEmail) 



 
module.exports = userRoute
        