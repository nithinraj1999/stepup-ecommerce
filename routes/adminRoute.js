const express = require("express");
const adminController = require("../Controller/adminController")
const bodyParser = require("body-parser")
const adminRoute = express();
const validate = require("../validation/validation")
const multer = require("multer")

const path = require('path');

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

adminRoute.get("/user",adminController.loadUser)
adminRoute.post("/user",adminController.restrict)

adminRoute.get("/category",adminController.loadCategory)
adminRoute.post("/category",adminController.addCategory)

adminRoute.get("/editcategory",adminController.loadEditCategory)
adminRoute.post("/editcategory",adminController.editCategory) 

adminRoute.get("/updatecategory",adminController.loadUpdateCategory)
adminRoute.post("/updatecategory",adminController.updateCategory)

adminRoute.get("/addproduct",adminController.loadAddProduct)
adminRoute.post("/addproduct",upload.array("avatar",4),adminController.addProduct)

adminRoute.get("/all-products",adminController.allProducts)
adminRoute.post("/all-products",adminController.editProducts)


adminRoute.get("/update-product",adminController.loadUpdateProduct)
adminRoute.post("/update-product",upload.array("avatar",4),adminController.updateProduct)
adminRoute.get("/delete-img/*",adminController.deleteimage)

 
 
module.exports = adminRoute    