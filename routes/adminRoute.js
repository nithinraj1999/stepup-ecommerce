const express = require("express");
const adminController = require("../Controller/adminController")
const bodyParser = require("body-parser")
const adminRoute = express();

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
 
module.exports = adminRoute  