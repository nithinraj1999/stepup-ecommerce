const express = require("express");
const adminController = require("../Controller/adminController")
const bodyParser = require("body-parser")
const adminRoute = express();
const validate = require("../validation/validation")
const multer = require("multer")
const nocache = require("nocache");


const path = require('path');
adminRoute.set("views","views/admin")
const auth = require("../middleware/authAdmin");
adminRoute.use(nocache());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
        // Use the original filename and add a unique identifier
        const uniqueIdentifier = Date.now();
        const originalFileNameWithoutExtension = path.parse(file.originalname).name;
        const uniqueFilename = `${originalFileNameWithoutExtension}-${uniqueIdentifier}${path.extname(file.originalname)}`
        
        cb(null, uniqueFilename);
    },
});

const upload = multer({ storage:storage}); 



adminRoute.use(bodyParser.json());
adminRoute.use(bodyParser.urlencoded({ extended: true }));

adminRoute.get("/",adminController.loginLoad)
adminRoute.post("/",adminController.verifyLogin)

adminRoute.get("/logout",adminController.logout); 
adminRoute.get("/user",auth.isLogin,adminController.loadUser)
adminRoute.post("/user",adminController.restrict)

adminRoute.get("/category",auth.isLogin,adminController.loadCategory)
adminRoute.post("/category",auth.isLogin,adminController.addCategory)

adminRoute.get("/editcategory",adminController.loadEditCategory)
adminRoute.post("/editcategory",auth.isLogin,adminController.editCategory) 

adminRoute.get("/updatecategory",auth.isLogin,adminController.loadUpdateCategory)
adminRoute.post("/updatecategory",auth.isLogin,adminController.updateCategory)

adminRoute.get("/addproduct",auth.isLogin,adminController.loadAddProduct)
adminRoute.get("/load-subcategories",adminController.loadSubcategories)

adminRoute.post("/addproduct",auth.isLogin,upload.array("avatar",4),adminController.addProduct)

adminRoute.get("/all-products",auth.isLogin,adminController.allProducts)
adminRoute.post("/all-products",adminController.editProducts)

adminRoute.get("/update-product",auth.isLogin,adminController.loadUpdateProduct)
adminRoute.post("/update-product",auth.isLogin,upload.array("avatar",4),adminController.updateProduct)
adminRoute.get("/delete-img/*",auth.isLogin,adminController.deleteimage)


//=========================== order ========== 

adminRoute.get("/orders",auth.isLogin,adminController.loadOrders)
adminRoute.post("/order-status",auth.isLogin,adminController.orderStatus)
adminRoute.post("/customer-Request",adminController.orderRequest)



//====================== coupens =================

adminRoute.get("/coupens",adminController.loadCoupenPage)
adminRoute.post("/add-new-coupen",adminController.addNewCoupen)
adminRoute.post("/delete-coupon",adminController.deleteCoupen)
adminRoute.post("/load-edit-coupen",adminController.loadEditCoupen)
adminRoute.post("/edit-coupen",adminController.editCoupen)
//===================  offer ======================================

adminRoute.get("/offer",adminController.offer)
adminRoute.post("/add-offer",adminController.addOffer) 

adminRoute.post("/delete-offer",adminController.deleteOffer)
adminRoute.get("/load-edit-offer",adminController.loadEditOffer)
adminRoute.post("/edit-offer",adminController.editOffer)


//========== category offer

adminRoute.post("/apply-offer",adminController.applyOffer) 
adminRoute.post("/remove-offer",adminController.removeOffer)
//==================== product Offer ==================

adminRoute.post("/apply-product-offer",adminController.applyProductOffer) 
adminRoute.post("/remove-product-offer",adminController.removeProductOffer) 

//==================== sales report ===================
adminRoute.get("/sales",adminController.loadSalesReport) 
adminRoute.post("/monthly-report",adminController.monthlyReport) 
adminRoute.get("/monthly-report",adminController.loadMonthlyReport) 
adminRoute.get("/weekly-report",adminController.loadWeeklyReport) 
adminRoute.get("/yearly-report",adminController.loadyearlyReport) 
adminRoute.get("/daily-report",adminController.loadDailyReport) 
adminRoute.post("/custom-date-report",adminController.cutomDatereport) 
adminRoute.get("/custom-date-report",adminController.getCutomDatereport) 


//==================== dashboard ======================


adminRoute.get("/dashboard",adminController.loadDashBoard) 













module.exports = adminRoute     