const express = require("express");
const controller= require("../Controller/userController")
const bodyParser = require("body-parser")
const userRoute = express();
const session = require("express-session")
const nocache = require("nocache");
const coupenModal = require("../models/coupenModel")
var flash = require('connect-flash');


const productController =  require("../Controller/productController")
const wishListController = require("../Controller/wishListController")
const cartController = require("../Controller/cartController")
const coupenController = require("../Controller/coupenController")
const walletController = require("../Controller/walletController")
const orderController = require("../Controller/orderController")

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

userRoute.get("/products",auth.isBlocked,productController.loadProductList)
userRoute.get("/men",auth.isBlocked,productController.loadMen) 
userRoute.get("/women",auth.isBlocked,productController.loadWomen)
userRoute.get("/kids",auth.isBlocked,productController.loadKids) 
userRoute.get("/product-details",auth.isBlocked,productController.loadProductDetails)

//================ My account ===================   
 

userRoute.get("/account",auth.isBlocked,auth.isLogin,controller.myAccount)  
userRoute.post("/edit-user",auth.isBlocked,controller.editUser) 
userRoute.post("/address",auth.isBlocked,controller.addAddress)
userRoute.get("/edit-address/:id",auth.isBlocked,controller.loadEditAddress)
userRoute.post("/edit-address",auth.isBlocked,controller.editAddress)
userRoute.post("/delete-address",auth.isBlocked,controller.deleteAddress)
userRoute.get("/wallet",auth.isBlocked,auth.isLogin,walletController.loadWallet)  
userRoute.get("/address",auth.isBlocked,auth.isLogin,controller.address)  
userRoute.get("/my-orders",auth.isBlocked,auth.isLogin,controller.myOrders) 

//===================== Cart=====================

userRoute.post('/add-to-cart',cartController.addTocart)
userRoute.get("/cart",auth.isBlocked,auth.isLogin,cartController.loadCart)
userRoute.post("/update-cart",auth.isLogin,cartController.updateCart)
userRoute.post("/remove-item",auth.isLogin,cartController.removeItem)

//===================== Checkout ================
 
userRoute.get('/checkout',auth.isBlocked,orderController.loadCheckout)
userRoute.post('/checkout-verification',orderController.checkOutVerification)

//===================== orders ==================

userRoute.get("/order",auth.isBlocked,orderController.loadOrderSuccess) 
userRoute.post("/order",orderController.order)
userRoute.get("/order-invoice",orderController.loadInvoice)
userRoute.get("/order-details",auth.isBlocked,auth.isLogin,orderController.orderDetails) 
userRoute.post("/order-cancelation",orderController.cancelRequest)
userRoute.post("/request-return",orderController.returnRequest)

//================== Razorpayment ==================

userRoute.post("/verify-payment",orderController.verifyPayment)
userRoute.post("/failed-payment",orderController.failedPayment)
userRoute.get("/paymen-failed",auth.isBlocked,orderController.paymentFailed)
userRoute.post("/retry-payment", orderController.retryPayment);
//===================== wishList =================

userRoute.post("/wish-list",wishListController.addToWishList)
userRoute.get("/my-wish-list",auth.isBlocked,wishListController.loadWishList)
userRoute.post("/remove-from-wishlist",wishListController.removeWishList) 

//====================== coupens =================

userRoute.post("/apply-coupen",coupenController.applyCoupen)

//=================== forgot password ============

userRoute.get("/reset-password",controller.loadEmailSubmit)
userRoute.post("/reset-password",controller.sendResetLink)
userRoute.get("/reset",controller.loadResetPassword)
userRoute.post("/reset",controller.resetPassword)
userRoute.get("/send-reset-email",controller.sendResetEmail) 






 
module.exports = userRoute
        