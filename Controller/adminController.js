const userModel = require("../models/userModel")
const category = require("../models/categoryModel")
const productModal = require("../models/productModel")
const path = require("path")
const sharp = require("sharp")
const Swal = require("sweetalert2")
const categoryModel = require("../models/categoryModel")
const orderModel = require("../models/orderModel")
const walletModel = require("../models/walletModel")
const coupenModel = require("../models/coupenModel")
const offerModel = require("../models/offer")
const { table } = require("console")


const express = require("express")
const app = express()


app.set("view engine", "ejs")
app.set(path.join(__dirname, "views", "admin"))

const loginLoad = (req, res) => {
    try{
        if(req.session.admin_id){
            res.redirect("/admin/dashboard")
          }else{
            res.render("adminLogin");
          }
    }catch(error){
        console.error(error);
    }
  
};

const verifyLogin = async (req,res)=>{
  try{  
    let {email} = req.body
    let {password} = req.body
    const find = await userModel.findOne({email:email,isAdmin:true})
    if(find) {
       if(find.password == password){
        req.session.admin_id = find._id
        // res.render("adminDashboard")
        res.redirect("/admin/dashboard")
        }else{
        res.render("adminLogin")
       } 
    }else{ 
        console.log("failed");
        res.render("adminLogin")
     }
}catch(error){
  console.log(error);
}
}



const logout = (req,res)=>{
  try {
    req.session.admin_id =null
    res.redirect('/admin')
} catch (error) {
    console.log(error)
} 
}
 
const loadUser = async (req, res) => {
    try {
        const ITEMS_PER_PAGE = 8
        const page = parseInt(req.query.page) || 1
        const totalUsersCount = await userModel.countDocuments({
            isAdmin: false,
        })
        const totalPages = Math.ceil(totalUsersCount / ITEMS_PER_PAGE)
        const skip = (page - 1) * ITEMS_PER_PAGE
        const find = await userModel
            .find({ isAdmin: false })
            .skip(skip)
            .limit(ITEMS_PER_PAGE)

        res.render('allUsers', { find, totalPages, currentPage: page })
    } catch (error) {
        console.log(error)
    }
}


 
const restrict = async (req,res)=>{
    try{
        const id = req.query.id
        let find = await userModel.findOne({_id:id})  
        if(find.isBlock==false){
           await userModel.updateOne({_id:id},{$set:{isBlock:true}})        
             res.redirect("/admin/user")          
        }else{ 
            await userModel.updateOne({_id:id},{$set:{isBlock:false}})
            res.redirect("/admin/user")      
        }
    }catch(error){
        console.error(error);
    }
 
}

const loadCategory = (req,res)=>{
    try{
        res.render("category")
    }catch(error){
        console.error(error);
    }
   
}

const addCategory = async (req,res)=>{
    try{
        const {maincategory} = req.body
        const subcate =req.body.subcategory
        const {description} =req.body 
        subcategory = subcate.toLowerCase();
        const find = await category.find({name:maincategory,subcategory:subcategory})
        if(find.length ==0){
          const categoryCollection = new category({
            name:maincategory,
            subcategory:subcategory,
            description:description
        })
        await categoryCollection.save()
       res.render("category", {alertMessage: null});
        }else{
        
         res.render("category", {exist:"Category Already Exists"});
        }
    }catch(error){
        console.error(error);
    }
    
      
}

const loadEditCategory = async (req,res)=>{
    try{
        const find = await category.find({}).populate("offer")
        const offer = await offerModel.find({})
        res.render("editCategory",{find,offer})
    }catch(error){
        console.error(error);
    }
   
}

const editCategory = async (req,res)=>{ 
    try{
        const {action} = req.body
        const id = req.query.id 
        const offer = await offerModel.find({})
        if(action ==="block"){
          
           await category.updateOne({_id:id},{$set:{isBlock:true}})
           const find = await category.find({});
          res.render("editCategory",{find,offer})
      
        }else if(action === "unblock"){
         await category.updateOne({_id:id},{$set:{isBlock:false}})
          const find = await category.find({});
          res.render("editCategory",{find,offer})
      
        }else if(action === "delete"){
          await category.deleteOne({_id:id})
           const find = await category.find({});
           res.render("editCategory",{find,offer})
      
        }else if(action === "update"){
          const find = await category.findOne({_id:id})
          res.redirect(`/admin/updatecategory?id=${id}`)
        }else{  
          console.log("unknown button clicked");
        }
    }catch(error){
        console.error(error);
    }

  
}

const loadUpdateCategory = async (req,res)=>{
    try{
        const id = req.query.id 
        const find = await category.findOne({_id:id})
        res.render("updateCategory",{find})
    }catch(error){
        console.error(error);
    }
   
}

const updateCategory = async(req,res)=>{ 
    try{
        const id = req.query.id
        const {maincategory,subcategory,description} = req.body
        const lowerSubcategory = subcategory.toLowerCase()
        
        const find = await category.find({name:maincategory,subcategory:lowerSubcategory})
        if(find.length ==0){
            await category.updateOne({_id:id},{$set:{name:maincategory,subcategory:lowerSubcategory,description:description}})
            res.redirect("/admin/editcategory")
        }else{
            const find = await category.findOne({_id:id})
            res.render("updateCategory",{find,exist:"Category Already Exist"})
        } 
    }catch(error){
        console.error(error);
    }
  
}


const loadAddProduct = async (req,res)=>{
    try{
        const find = await category.distinct("subcategory")
        res.render("addProduct",{find})
    }catch(error){
        console.error(error);
    }
  
}

const loadSubcategories = async (req,res)=>{
    try{
        const {mainCategory} = req.query
        const subcategory = await category.distinct("subcategory",{name:mainCategory})
      
        res.status(200).json({ message: "Subcategories loaded successfully",subcategory});
    }catch(error){
        console.error(error);
    }
 
}


//========================================Add product with image=============================
const addProduct = async (req,res)=>{

    try{
      const {name,manufacturer,price,description,subcategory,maincategory,quantity} = req.body
      const  find  = await category.findOne({name:maincategory,subcategory:subcategory})
      const subcategory_id = find._id 
      const productImages = await Promise.all(req.files.map(async (file) => {
            try {
                console.log("promise is working");
                const resizedFilename = `resized-${ file.filename }`
                const resizedPath = path.join(__dirname, '../public/uploads',resizedFilename)
                                 
                await sharp(file.path)
                    .resize({ height: 500, width: 550, fit: 'fill' })
                    .toFile(resizedPath);
 
                return {
                    filename: file.filename,
                    path: file.path,
                    resizedFile: resizedFilename,

                };
            } catch (error) { 
                console.error('Error processing and saving image:', error);
                return null; // Exclude failed images
            }
        }))

        const productCollection = new productModal({
            name: name,
            manufacturer: manufacturer,
            price: price,
            description: description,
            subcategory_id: subcategory_id,
            quantity: quantity,
            product_image: productImages,
        })
        
       
      const save =await productCollection.save() 

    }catch(error){
      console.log(error); 
    }
    const find = await category.distinct("subcategory")
     res.render("addProduct",{find})
}
 

const allProducts = async (req, res) => {
  try {
    const ITEMS_PER_PAGE = 8; 
    const page = parseInt(req.query.page) || 1;
    const totalProductsCount = await productModal.countDocuments();
    const totalPages = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const find = await productModal
      .find({})
      .populate("subcategory_id")
      .populate("offer")
      .skip(skip)
      .limit(ITEMS_PER_PAGE);

    const offer = await offerModel.find({});

    res.render("allProducts", { find, offer, totalPages, currentPage: page });
  } catch (error) {
    console.log(error);
  }
};

 



const editProducts = async (req,res)=>{

  try{
     const id = req.query.id 
     const {action} = req.body
    if(action == "list"){
     
      const find = await productModal.findOne({_id:id})
      if(find.list==true){
         await productModal.updateOne({_id:id},{$set:{list:false}})
         res.redirect("/admin/all-products")
      }else {
         await productModal.updateOne({_id:id},{$set:{list:true}})
         res.redirect("/admin/all-products")
      }
    }else if(action =="update"){
      res.redirect(`/admin/update-product?id=${id}`)
    }
    }catch(error){
    console.log(error);
    }
  
}

const loadUpdateProduct = async (req,res)=>{

  try{
      const id  = req.query.id
      const subcategory = await category.distinct("subcategory")
      const find = await productModal.findOne({_id:id}).populate("subcategory_id")
      res.render("updateProducts",{find,subcategory})
  }catch(error){
      console.log(error);
  }
}

const updateProduct = async(req,res)=>{
 
    try {

    const { id } = req.query;
    const { name, manufacturer, price, description, maincategory, subcategory,quantity } = req.body;

    const find= await category.findOne({name:maincategory,subcategory:subcategory})
    const productImages = await Promise.all(req.files.map(async (file) => {
      try {
          console.log("promise is working");
          const resizedFilename = `resized-${ file.filename }`
          const resizedPath = path.join(__dirname, '../public/uploads',resizedFilename)

          await sharp(file.path)
              .resize({ height: 500, width: 550, fit: 'fill' })
              .toFile(resizedPath);

          return {
              filename: file.filename,
              path: file.path,
              resizedFile: resizedFilename,

          }; 
      } catch (error) {
          console.error('Error processing and saving image:', error);
          return null; // Exclude failed images
      }
  }))
    if(find){

      const updatedFields = {
        name: name,
        manufacturer: manufacturer,
        price: price,
        description: description,
        subcategory_id: find._id,
        quantity: quantity
      };
  
      if (productImages && productImages.length > 0) {
        updatedFields.product_image = productImages;
      }
  
      // Update the product
      const result = await productModal.updateOne({ _id: id }, { $set: updatedFields });
  
    }else{
      const subcategory1 = await category.distinct("subcategory")
      const find2 = await productModal.findOne({_id:id}).populate("subcategory_id")
      res.render("updateProducts",{find:find2,subcategory:subcategory1})
    }
    
      const subcategory1 = await category.distinct("subcategory")
      const find2 = await productModal.findOne({_id:id}).populate("subcategory_id")
      res.render("updateProducts",{find:find2,subcategory:subcategory1})
  } catch (error) {
    console.log(error); 
    res.status(500).send("Internal Server Error");
  }
};



const deleteimage = async (req,res)=>{
    try{
        const {product_id,img_id} = req.query
        await productModal.updateOne(
        {_id:product_id},
        {
          $pull:{
            product_image:{
              _id:img_id
            }}
        })
        const find = await productModal.find({})
        res.redirect(`/admin/update-product?id=${product_id}`)
    }catch(error){
        console.error(error);
    }
  

}




const loadOrders = async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = 7
    const skip = (page - 1) * limit
    try {
        const orders = await orderModel
            .find({ paymentStatus:{$ne:"Failed"}})
            .populate('userId')
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit)

        const totalOrders = await orderModel.countDocuments()

        const totalPages = Math.ceil(totalOrders / limit)

        res.render('adminAllOrders.ejs', {
            orders,
            totalPages,
            currentPage: page,
        })
    } catch (error) {
        console.error('Error fetching orders:', error)
    }
}


const orderStatus = async(req,res) =>{
  try{
    const {currentStatus,orderId,productId} = req.body
    const find = await orderModel.findOne({_id:orderId})
    await orderModel.updateOne(
      { "_id": orderId, "products._id": productId },
      { $set: { "products.$.orderStatus": currentStatus } }
    );  
    res.json({success:true,currentStatus}) 
  }
  catch(error){ 
    console.error(error);
  }
} 
 

const orderRequest = async (req, res) => {
    try {
        const { status, orderId, productId } = req.body
        if (status == 'Reject Request') {
            await orderModel.updateOne(
                { _id: orderId, 'products._id': productId },
                { $set: { 'products.$.orderStatus': 'Delivered' } }
            )
        } else {
            await orderModel.updateOne(
                { _id: orderId, 'products._id': productId },
                { $set: { 'products.$.orderStatus': 'Product Returned' } }
            )

            const order = await orderModel.findOne({ _id: orderId })

            const returnedProduct = order.products.find(
                (item) => item._id == productId
            )
            const returnedProductId = returnedProduct.productId
            const quantityOfReturned = returnedProduct.quantity

            await productModal.updateOne(
                { _id: returnedProductId },
                { $inc: { quantity: quantityOfReturned } }
            )

            const orders = await orderModel.findOne({
                _id: orderId,
                'products._id': productId,
            })
            const orderStatus = orders.products[0].orderStatus

            const priceOfReturned = returnedProduct.price
            const totalPriceOfReturned = priceOfReturned * quantityOfReturned

            const userId = order.userId

            const wallet = await walletModel.findOne({ userId: userId })
            if (!wallet) {
                const addBalaceToWallet = new walletModel({
                    userId: userId,
                    balance: priceOfReturned,
                    transactions: [
                        {
                            amount: totalPriceOfReturned,
                        },
                    ],
                })

                await addBalaceToWallet.save()
            } else {
                await walletModel.updateOne(
                    { userId: userId },
                    {
                        $inc: { balance: totalPriceOfReturned },
                        $push: {
                            transactions: { amount: totalPriceOfReturned },
                        },
                    }
                )
            }
        }

        res.json({ status, orderStatus })
    } catch (error) {
        console.error(error)
    }
}
 
    



const loadCoupenPage = async (req, res) => {
    try {
        const ITEMS_PER_PAGE = 5
        const page = parseInt(req.query.page) || 1
        const totalCouponsCount = await coupenModel.countDocuments()
        const totalPages = Math.ceil(totalCouponsCount / ITEMS_PER_PAGE)
        const skip = (page - 1) * ITEMS_PER_PAGE
        const coupens = await coupenModel
            .find({})
            .skip(skip)
            .limit(ITEMS_PER_PAGE)

        res.render('coupens', { coupens, totalPages, currentPage: page })
    } catch (error) {
        console.error(error)
    }
}

const addNewCoupen = async (req, res) => {
    try {
        const {
            couponTitle,
            couponCode,
            validFrom,
            validUntil,
            discountPercentage,
            minTotalPrice,
        } = req.body

        const coupenCodeUpperCase = couponCode.toUpperCase()
        const coupen = new coupenModel({
            coupenName: couponTitle,
            coupenCode: coupenCodeUpperCase,
            discount: discountPercentage,
            minPurchaseAmount: minTotalPrice,
            validFrom: validFrom,
            validUntill: validUntil,
        })
        await coupen.save()

        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}  

const deleteCoupen = async (req, res) => {
    try {
        const { couponId } = req.body
        await coupenModel.deleteOne({ _id: couponId })
        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}

const loadEditCoupen = async (req,res)=>{
  try{

    const  {coupenId} = req.body
    
    const coupenDetails = await coupenModel.findOne({_id:coupenId})
    res.json({coupenDetails})

  }
  catch(error){
    console.error(error);
  }
}

const editCoupen = async (req, res) => {
    try {
        const {
            coupenId,
            title,
            coupenCode,
            validFrom,
            validUntill,
            discount,
            minPrice,
        } = req.body
        const coupenCodeUpperCase = coupenCode.toUpperCase()
        const coupen = await coupenModel.findOne({
            coupenCode: coupenCodeUpperCase,
        })
        if (!coupen) {
            await coupenModel.updateOne(
                { _id: coupenId },
                {
                    $set: {
                        coupenName: title,
                        coupenCode: coupenCodeUpperCase,
                        validFrom: validFrom,
                        validUntill: validUntill,
                        discount: discount,
                        minPurchaseAmount: minPrice,
                    },
                }
            )
            res.json({ success: true })
        } else {
            res.json({ message: 'Coupen alredy exist', alreadyExist: true })
        }
    } catch (error) {
        console.error(error)
    }
}

const offer = async (req, res) => {
    try {
        const offer = await offerModel.find({})
        res.render('offer', { offer })
    } catch (error) {
        console.log(error)
    }
}

const addOffer = async (req,res)=>{
  try{

    const {offerName,offerPercentage,startDate,endDate} = req.body
    const uppercaseName = offerName.toUpperCase();
    const isOfferNameExist = await offerModel.findOne({name:uppercaseName})
    if(!isOfferNameExist){
      const offer = new offerModel({
        name:uppercaseName,
        percentage:offerPercentage,
        startDate:startDate,
        endDate:endDate
      })
      await offer.save()
      res.json({success:true})
    }else{
      res.json({alreadyExist:"offer already Exist"})
    }
  }
  catch(error){
    console.error(error);
  }
}


const applyOffer = async(req,res)=>{
try{
  const {categoryId,selectedOfferId} = req.body
  await categoryModel.updateOne({_id:categoryId},{$set:{offer:selectedOfferId}})
  res.json({success:true})
}
catch(error){
  console.error(error);
}
}
 
const deleteOffer = async (req,res)=>{
try{
   const {offerId} = req.body
   await offerModel.deleteOne({_id:offerId})

   res.json({success:true})
}
catch(error){
  console.error(error);
}
}

const loadEditOffer = async(req,res)=>{
  try{
    const {offerid} = req.query
  
    const offer = await offerModel.findOne({_id:offerid})
  
    res.json({offer})
  }catch(error){
    console.error(error);
  }
} 

const editOffer = async (req,res)=>{
try{
  const {offerid} =req.query
  
const {name,
  percentage,
  startDate,
  endDate} = req.body
const nameToUpper = name.toUpperCase()

const isExist = await offerModel.findOne({name:nameToUpper})

if(!isExist){
  const offer = await offerModel.updateOne(
    { _id: offerid },
    {
        $set: {
            name: nameToUpper,
            percentage: percentage,
            startDate: startDate,
            endDate: endDate
        }
    }   
  );
  res.json({success:true})
}else{
  res.json({message:"alreadyExist"})
}
 
}
catch(error){
  console.error(error);
}
}
 

const removeOffer = async (req, res) => {
    try {
        const { categoryId } = req.body
        await categoryModel.updateOne(
            { _id: categoryId },
            { $unset: { offer: '' } }
        )
        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}


const applyProductOffer = async (req, res) => {
    try {
        const { productId, selectedOfferId } = req.body
        await productModal.updateOne(
            { _id: productId },
            { $set: { offer: selectedOfferId } }
        )
        console.log(req.body)
        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
} 



const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body
        await productModal.updateOne(
            { _id: productId },
            { $unset: { offer: '' } }
        )
        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}

const loadSalesReport = async (req, res) => {
  const page = parseInt(req.query.page) || 1

  const limit = 20
  const skip = (page - 1) * limit
  try {
      const orders = await orderModel
          .find({})
          .populate('userId')
          .sort({ _id: -1 })
          .skip(skip)
          .limit(limit)

      const totalOrders = await orderModel.countDocuments()
      const totalPages = Math.ceil(totalOrders / limit)

      res.render('sales', {
          orders,
          totalPages,
          currentPage: page,
      })
  } catch (error) { 
      console.error('Error fetching orders:', error)
  }
} 


const monthlyReport = async (req, res) => {
  try{

  
    const { month } = req.body
    res.redirect(`/admin/monthly-report?month=${month}`)
  }
  catch(error){
    console.error(error);
  }
}


const loadMonthlyReport = async (req, res) => {
    const month = req.query.month
    const monthIndex = new Date(Date.parse(month + ' 1, 2000')).getMonth()

    const startDate = new Date(new Date().getFullYear(), monthIndex, 1)
    const endDate = new Date(new Date().getFullYear(), monthIndex + 1, 0)
    try {
        const orders = await orderModel 
            .find({ orderDate: { $gte: startDate, $lt: endDate } })
            .populate('userId')
            .sort({ _id: -1 })
        res.render('salesReport', {
            orders,
        })
    } catch (error) {
        console.error('Error fetching orders:', error)
    }
}


const loadWeeklyReport = async (req, res) => {
    const currentDate = new Date()
    const startOfWeek = new Date(
        currentDate.setDate(currentDate.getDate() - currentDate.getDay())
    ) 
    const endOfWeek = new Date(currentDate.setDate(currentDate.getDate() + 6)) 

    try {
        const orders = await orderModel
            .find({ orderDate: { $gte: startOfWeek, $lt: endOfWeek } })
            .populate('userId')
            .sort({ _id: -1 })
        res.render('salesReport', {
            orders,
        })
    } catch (error) {
        console.error('Error fetching orders:', error)
    }
}

const loadyearlyReport = async (req, res) => {
    const currentDate = new Date()
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1) // Start of current year
    const endOfYear = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59) // End of current year

    try {
        const orders = await orderModel
            .find({ orderDate: { $gte: startOfYear, $lt: endOfYear } })
            .populate('userId')
            .sort({ _id: -1 })
        res.render('salesReport', {
            orders,
        })
    } catch (error) {
        console.error('Error fetching orders:', error)
    }
}


const loadDailyReport = async (req, res) => {
  const currentDate = new Date();
  const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()); // Start of current day
  const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59); // End of current day

    try {
        const orders = await orderModel
            .find({ orderDate: { $gte: startOfDay, $lt: endOfDay } })
            .populate('userId')
            .sort({ _id: -1 })
        res.render('salesReport', {
            orders,
        })
    } catch (error) {
        console.error('Error fetching orders:', error)
    }
}


const cutomDatereport = async (req, res) => {
    try {
        const { startDate, endDate } = req.body
    
        res.redirect(
            `/admin/custom-date-report?startDate=${startDate}&endDate=${endDate}`
        )
    } catch (error) {
        console.error()
    } 
}


const getCutomDatereport = async (req, res) => {
    try {
        const startDate = new Date(req.query['startDate'])
        const endDate = new Date(req.query['endDate'])
        const orders = await orderModel
            .find({ orderDate: { $gte: startDate, $lt: endDate } })
            .populate('userId')
            .sort({ _id: -1 })
        res.render('salesReport', {
            orders,
        })
    } catch (error) {
        console.error(error)
    }
}


const loadDashBoard = async (req, res) => {
    try {
      const subTotalSum = await orderModel.aggregate([{$group:{_id:null,total:{$sum:"$subTotal"}}}])
      const totalRevenue = subTotalSum[0].total
      const totalOrder = await orderModel.find({}).count()
      const pendingOrdersRequest = await orderModel.find({ "products": { $elemMatch: { orderStatus: "Requested Return" } } }).count()
    //   const totalProductReturned =  await orderModel.find({ "products": { $elemMatch: { orderStatus: "Product Returned" } } }).count()
       const totalProductCancelled = await orderModel.find({ "products": { $elemMatch: { orderStatus: "Canceled" } } }).count()
    const totalReturnedProducts = await orderModel.aggregate([
        { $unwind: "$products" }, // Unwind the products array
        { $match: { "products.orderStatus": "Product Returned" } }, // Match only returned products
        { $group: { _id: null, count: { $sum: 1 } } } // Group to count returned products
      ]);
      
      const returnedProductCount = totalReturnedProducts.length > 0 ? totalReturnedProducts[0].count : 0;
      
      const placed = await orderModel.find({ "products": { $elemMatch: { orderStatus: "Placed" } } }).count()
      const shipped = await orderModel.find({ "products": { $elemMatch: { orderStatus: "Shipped" } } }).count()
      const packed = await orderModel.find({ "products": { $elemMatch: { orderStatus: "Packed" } } }).count()
      const delivered = await orderModel.find({ "products": { $elemMatch: { orderStatus: "Delivered" } } }).count()

      const currentYear = new Date().getFullYear();
      // Get orders for the current year
      const orders = await orderModel.find({
          orderDate: {
              $gte: new Date(`${currentYear}-01-01`),
              $lte: new Date(`${currentYear}-12-31T23:59:59.999`)
          }
      });  
  
      // Calculate total earnings for each month
      const monthlyEarnings = Array(12).fill(0); // Initialize array for 12 months with zeros
      orders.forEach(order => {
          const month = order.orderDate.getMonth(); // Month is zero-based (0 for January)
          monthlyEarnings[month] += order.subTotal;
      });

      const topSellingProducts = await orderModel.aggregate([
        { $unwind: "$products" }, // Unwind the products array
        {
            $group: {
                _id: "$products.productId",
                totalQuantity: { $sum: "$products.quantity" }
            }
        }, // Group by productId and sum the quantities
        { $sort: { totalQuantity: -1 } }, // Sort by totalQuantity in descending order
        { $limit: 10 }, // Limit to top 10 selling products
        {
            $lookup: {
                from: "products", // The name of the collection to join with
                localField: "_id", // The field from the input documents
                foreignField: "_id", // The field from the documents of the "products" collection
                as: "product" // The output array field
            }
        },
        {
            $addFields: {
                productName: { $arrayElemAt: ["$product.name", 0] } // Extract the name from the product array
            }
        },
        {
            $project: {
                _id: 1,
                totalQuantity: 1,
                productName: 1
            }
        }
    ]);
    
  
    const topSellingCategories = await orderModel.aggregate([
      { $unwind: "$products" },
      {
          $lookup: {
              from: "products",
              localField: "products.productId",
              foreignField: "_id",
              as: "product"
          }
      },
      { $unwind: "$product" },
      {
          $lookup: {
              from: "categories",
              localField: "product.subcategory_id",
              foreignField: "_id",
              as: "category"
          }
      },
      { $unwind: "$category" },
      {
          $group: {
              _id: "$category.name",
              totalQuantity: { $sum: "$products.quantity" }
          }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 3 }
  ]);


  
        // Find top 10 selling brands
        const totalSalesByBrand = await orderModel.aggregate([
          { $unwind: "$products" },
          {
              $lookup: {
                  from: "products",
                  localField: "products.productId",
                  foreignField: "_id",
                  as: "product"
              }
          },
          { $unwind: "$product" },
          {
              $group: {
                  _id: "$product.manufacturer",
                  totalQuantity: { $sum: "$products.quantity" }
              }
          },
          { $sort: { totalQuantity: -1 } } // Sort by brand name
      ]);





      // Calculate average monthly earnings
      const totalEarnings = monthlyEarnings.reduce((total, earnings) => total + earnings, 0);
      const averageMonthlyEarnings = totalEarnings / 12;
      const roundedAverageMonthlyEarnings = Math.round(averageMonthlyEarnings * 100) / 100; // Round to 2 decimal places

      res.render('dashboard', {
          totalRevenue,
          totalOrder,
          returnedProductCount,
          totalProductCancelled,
          roundedAverageMonthlyEarnings,
          pendingOrdersRequest,
          placed,
          packed,
          delivered,
          shipped,
          monthlyEarnings,
          topSellingProducts,
          topSellingCategories,
          totalSalesByBrand
      }) 
    } catch (error) { 
        console.error(error)
    }
}
 
 
 
module.exports = {  
  loginLoad,
  verifyLogin,
  loadUser,
  restrict,
  loadCategory,
  addCategory, 
  loadEditCategory,
  editCategory,
  loadUpdateCategory,
  updateCategory,
  loadAddProduct,
  addProduct,
  allProducts,
  editProducts,
  loadUpdateProduct,
  updateProduct,
  deleteimage,
  loadSubcategories, 
  logout,
  loadOrders,
  orderStatus,
  orderRequest,
  loadCoupenPage,
  addNewCoupen,
  deleteCoupen,
  offer,
  addOffer,
  applyOffer,
  deleteOffer,
  loadEditOffer,
  editOffer,
  removeOffer,
  applyProductOffer,
  removeProductOffer,
  loadEditCoupen,
  editCoupen,
  loadSalesReport,
  monthlyReport,
  loadMonthlyReport,
  loadWeeklyReport,
  loadyearlyReport,
  loadDailyReport,
  cutomDatereport,
  getCutomDatereport,
  loadDashBoard

}; 

