const userModel = require("../Models/userModel")
const category = require("../Models/categoryModel")
const productModal = require("../Models/productModel")
const path = require("path")
const sharp = require("sharp")
const Swal = require("sweetalert2")
const categoryModel = require("../Models/categoryModel")
const orderModel = require("../Models/orderModel")
const walletModel = require("../Models/walletModel")
const coupenModel = require("../Models/coupenModel")
const offerModel = require("../Models/offer")

const loginLoad = (req, res) => {
  if(req.session.admin_id){
    res.render("adminDashboard")
  }else{
    res.render("adminLogin");
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
        res.render("adminDashboard")
        }else{
        res.render("adminLogin")
       } 
    }else{ 
        console.log("failed");
        res.render("adminLogin")
     }
}catch(error){
  console.log(error.message);
}
}



const logout = (req,res)=>{
  try {
    req.session.destroy((err) => {
         if (err) {
              console.log('logout failed')
         } else {
              res.redirect('/admin')
         }
    }) 
} catch (error) {
    console.log(error)
} 
}
 
const loadUser = async (req,res)=>{
  const find = await userModel.find({isAdmin:false})
  res.render("allUsers",{find})
} 

 
const restrict = async (req,res)=>{
  const id = req.query.id
  let find = await userModel.findOne({_id:id})  
  if(find.isBlock==false){
     await userModel.updateOne({_id:id},{$set:{isBlock:true}})        
       res.redirect("/admin/user")          
  }else{ 
      await userModel.updateOne({_id:id},{$set:{isBlock:false}})
      res.redirect("/admin/user")      
  }
}

const loadCategory = (req,res)=>{

    res.render("category")
}

const addCategory = async (req,res)=>{
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
      
}

const loadEditCategory = async (req,res)=>{
    const find = await category.find({});
    const offer = await offerModel.find({})
    res.render("editCategory",{find,offer})
}

const editCategory = async (req,res)=>{ 

  const {action} = req.body
  const id = req.query.id 
  if(action ==="block"){
    
     await category.updateOne({_id:id},{$set:{isBlock:true}})
     const find = await category.find({});
    res.render("editCategory",{find})

  }else if(action === "unblock"){
   await category.updateOne({_id:id},{$set:{isBlock:false}})
    const find = await category.find({});
    res.render("editCategory",{find})

  }else if(action === "delete"){
    await category.deleteOne({_id:id})
     const find = await category.find({});
     res.render("editCategory",{find})

  }else if(action === "update"){
    const find = await category.findOne({_id:id})
    res.redirect(`/admin/updatecategory?id=${id}`)
  }else{  
    console.log("unknown button clicked");
  }
}

const loadUpdateCategory = async (req,res)=>{
   const id = req.query.id 
   const find = await category.findOne({_id:id})
   res.render("updateCategory",{find})
}

const updateCategory = async(req,res)=>{ 
  const id = req.query.id
  const {maincategory,subcategory,description} = req.body
  const lowerSubcategory = subcategory.toLowerCase()
  console.log(lowerSubcategory);
  const find = await category.find({name:maincategory,subcategory:lowerSubcategory})
  if(find.length ==0){
      await category.updateOne({_id:id},{$set:{name:maincategory,subcategory:lowerSubcategory,description:description}})
      res.redirect("/admin/editcategory")
  }else{
      const find = await category.findOne({_id:id})
      res.render("updateCategory",{find,exist:"Category Already Exist"})
  } 
}


const loadAddProduct = async (req,res)=>{
  const find = await category.distinct("subcategory")
  res.render("addProduct",{find})
}

const loadSubcategories = async (req,res)=>{
  const {mainCategory} = req.query
  const subcategory = await category.distinct("subcategory",{name:mainCategory})

  res.status(200).json({ message: "Subcategories loaded successfully",subcategory});
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
        name:name,
        manufacturer:manufacturer,
        price:price,
        description:description,
        subcategory_id:subcategory_id,
        quantity:quantity,
        product_image:productImages
      })
        
       
      const save =await productCollection.save() 

      // const populate = await productModal.find({}).populate("subcategory_id")    
    }catch(error){
      console.log(error); 
    }
    const find = await category.distinct("subcategory")
     res.render("addProduct",{find})
}


const allProducts = async(req,res)=>{

  try{
    const find = await productModal.find({}).populate("subcategory_id")
    res.render("allProducts",{find})
  }catch(error){
    console.log(error);
  }
}





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

}
const loadOrders = async (req,res) =>{
    const orders = await orderModel.find({}).populate("userId").sort({_id:-1})
    res.render("adminAllOrders.ejs",{orders})
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
 

const orderRequest = async (req,res)=>{
  try{
    const {status,orderId,productId} = req.body
    if(status == "Reject Request"){

      await orderModel.updateOne(
        { "_id": orderId, "products._id": productId },
        { $set: { "products.$.orderStatus":"Delivered"} }
      );
    
    }else{
      await orderModel.updateOne(
        { "_id": orderId, "products._id": productId },
        { $set: { "products.$.orderStatus": "Product Returned"} }
      );

      const order =  await orderModel.findOne({_id:orderId})

     const returnedProduct = order.products.find(item => item._id == productId)
     const returnedProductId = returnedProduct.productId
     const quantityOfReturned = returnedProduct.quantity


     await productModal.updateOne({_id:returnedProductId},{$inc:{quantity:quantityOfReturned}})
    
    const orders =await orderModel.findOne({ "_id": orderId,"products._id": productId })
    const orderStatus = orders.products[0].orderStatus

     


   const  priceOfReturned = returnedProduct.price
   const totalPriceOfReturned = priceOfReturned * quantityOfReturned

   const userId = order.userId


    const wallet = await walletModel.findOne({userId:userId})
    if(!wallet){
      const addBalaceToWallet = new walletModel({
      userId:userId,
      balance:priceOfReturned,
      transactions:[{
        amount:totalPriceOfReturned,
      }]
    })
  
    await addBalaceToWallet.save()
  
    }else{
  
      await walletModel.updateOne({userId:userId},{$inc:{balance:priceOfReturned},$push:{transactions:{amount:totalPriceOfReturned}}})
    }


  }



    

    
    res.json({ status, orderStatus });
 
  }
  catch(error){
    console.error(error);
  }
 

}
 
    



const loadCoupenPage = async(req,res)=>{
try{

  const coupens = await coupenModel.find({})

  res.render("coupens",{coupens})
}
catch(error){
  console.error(error);
}
}





const addNewCoupen = async (req,res)=>{

  try{
    const {couponTitle,couponCode,validFrom,validUntil,discountPercentage,minTotalPrice} =req.body
    const coupenCodeUpperCase = couponCode.toUpperCase()
    const coupen = new coupenModel({
      coupenName:couponTitle,
      coupenCode:coupenCodeUpperCase,
      discount:discountPercentage,
      minPurchaseAmount:minTotalPrice,
      validFrom:validFrom,
      validUntill:validUntil,
    })
       await coupen.save()  

       res.json({success:true})
  }
  catch(error){
    console.error(error);
  } 
}  


const deleteCoupen = async (req,res)=>{
  try{
    const {couponId} =req.body
   await coupenModel.deleteOne({_id:couponId})
  }
  catch(error){
    console.error(error);
  }
  res.json({success:true})
}



const offer = async (req,res)=>{
try{

  const offer = await offerModel.find({})
  res.render("offer",{offer})
}
catch(error){
  console.log(error);
}
}

const addOffer = async (req,res)=>{
  try{

    const {offerName,offerPercentage,startDate,endDate} = req.body
    const isOfferNameExist = await offerModel.findOne({name:offerName})
    if(!isOfferNameExist){
      const offer = new offerModel({
        name:offerName,
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
  const {mainCategory,subCategory,offerId} = req.body
  console.log(req.body);
  await categoryModel.updateOne({name:mainCategory,subcategory:subCategory},{$set:{offer:offerId}})
  const category = await categoryModel.findOne({name:mainCategory,subcategory:subCategory})
  console.log(category);
  res.json({success:true})
}
catch(error){
  console.error(error);
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
  applyOffer

}; 

