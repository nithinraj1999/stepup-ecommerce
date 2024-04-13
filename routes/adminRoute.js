const express = require("express");
const adminController = require("../Controller/adminController")
const bodyParser = require("body-parser")
const adminRoute = express();
const multer = require("multer")
const nocache = require("nocache");
const path = require('path');
adminRoute.set("views","views/admin")
const auth = require("../middleware/authAdmin");
adminRoute.use(nocache());


const categoryController = require("../Controller/categoryController")
const orderController = require("../Controller/orderController")
const coupenController = require("../Controller/coupenController")
const offerController = require("../Controller/offerController")
const salesController = require("../Controller/salesController")
const dashboardController = require("../Controller/dashboardController")
const productController = require("../Controller/productController")


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

adminRoute.get("/category",auth.isLogin,categoryController.loadCategory)
adminRoute.post("/category",auth.isLogin,categoryController.addCategory)

adminRoute.get("/editcategory",categoryController.loadEditCategory)
adminRoute.post("/editcategory",auth.isLogin,categoryController.editCategory) 

adminRoute.get("/updatecategory",auth.isLogin,categoryController.loadUpdateCategory)
adminRoute.post("/updatecategory",auth.isLogin,categoryController.updateCategory)
//---------product-----

adminRoute.get("/addproduct",auth.isLogin,productController.loadAddProduct)
adminRoute.get("/load-subcategories",productController.loadSubcategories)

adminRoute.post("/addproduct",auth.isLogin,upload.array("avatar",4),productController.addProduct)

adminRoute.get("/all-products",auth.isLogin,productController.allProducts)
adminRoute.post("/all-products",productController.editProducts)

adminRoute.get("/update-product",auth.isLogin,productController.loadUpdateProduct)
adminRoute.post("/update-product",auth.isLogin,upload.array("avatar",4),productController.updateProduct)
adminRoute.get("/delete-img/*",auth.isLogin,productController.deleteimage)


//=========================== order ========== 

adminRoute.get("/orders",auth.isLogin,orderController.loadOrders)
adminRoute.post("/order-status",auth.isLogin,orderController.orderStatus)
adminRoute.post("/customer-Request",orderController.orderRequest)



//====================== coupens =================

adminRoute.get("/coupens",auth.isLogin,coupenController.loadCoupenPage)
adminRoute.post("/add-new-coupen",coupenController.addNewCoupen)
adminRoute.post("/delete-coupon",coupenController.deleteCoupen)
adminRoute.post("/load-edit-coupen",coupenController.loadEditCoupen)
adminRoute.post("/edit-coupen",coupenController.editCoupen)
//===================  offer ======================================

adminRoute.get("/offer",auth.isLogin,offerController.offer)
adminRoute.post("/add-offer",offerController.addOffer) 

adminRoute.post("/delete-offer",offerController.deleteOffer)
adminRoute.get("/load-edit-offer",auth.isLogin,offerController.loadEditOffer)
adminRoute.post("/edit-offer",offerController.editOffer)


//========== category offer

adminRoute.post("/apply-offer",offerController.applyOffer) 
adminRoute.post("/remove-offer",offerController.removeOffer)
//==================== product Offer ==================

adminRoute.post("/apply-product-offer",offerController.applyProductOffer) 
adminRoute.post("/remove-product-offer",offerController.removeProductOffer) 

//==================== sales report ===================
adminRoute.get("/sales",auth.isLogin,salesController.loadSalesReport) 
adminRoute.post("/monthly-report",salesController.monthlyReport) 
adminRoute.get("/monthly-report",auth.isLogin,salesController.loadMonthlyReport) 
adminRoute.get("/weekly-report",auth.isLogin,salesController.loadWeeklyReport) 
adminRoute.get("/yearly-report",auth.isLogin,salesController.loadyearlyReport) 
adminRoute.get("/daily-report",auth.isLogin,salesController.loadDailyReport) 
adminRoute.post("/custom-date-report",salesController.cutomDatereport) 
adminRoute.get("/custom-date-report",auth.isLogin,salesController.getCutomDatereport) 


//==================== dashboard ======================


adminRoute.get("/dashboard",auth.isLogin,dashboardController.loadDashBoard) 













module.exports = adminRoute     