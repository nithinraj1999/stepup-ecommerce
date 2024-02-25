const otpGenerator = require("otp-generator")
const userModel = require("../Models/userModel")
const categoryModal = require("../Models/categoryModel")
const otpModel = require("../Models/otpModel")
const nodemailer = require("nodemailer")
const productModel = require("../Models/productModel")
const cartModal = require("../Models/cartModal")
const orderModal = require("../Models/orderModel")
const Swal = require('sweetalert2');
const mongoose = require('mongoose');
require('dotenv').config()
const bcrypt = require('bcrypt')



const securePassword = async (password) => {
  try {
       const passwordHash = await bcrypt.hash(password, 10)
       return passwordHash
  } catch (error) {
       console.log(error)
  }
}

const loadHomePage = (req,res)=>{
  if(req.session.user_id){
    res.render("firstPage")
  }else{
    res.render("home")
  }
   
}
 
const loadsignup = (req,res)=>{
    res.render("login")
}

// const signup = async (req,res)=>{
//   const {email} = req.body
//   const checkEmail = await userModel.find({email:email})
//   if(checkEmail==0){
//     const spassword = await securePassword(req.body.password)
//     const userDoc = new userModel({
//         name:req.body.name,
//         email:req.body.email, 
//         phone:req.body.phone,
//         password:spassword
//     })

//     await userDoc.save()
//     await otp(email)
//     res.render("otp-verification",{email})

//  }else{
//   res.render("login")
//  }
//  }  

const signup = async (req,res)=>{
  const {email,name,phone,password} = req.body
  
  const user = await userModel.findOne({email:email})
  
  if(!user){  
    
    const hashedPassword = await securePassword(password)
        const userData = new userModel({
            name:name,
            email:email, 
            phone:phone,
            password:hashedPassword
        })
        await userData.save()

        await otp(email)
        res.render("otp-verification",{email})

  }else{
      if(user.isVerified == true){
        res.render("login")  
      }else if(user.isVerified == false){
        await otp(email)
        res.render("otp-verification",{email})
      }
  }
 } 
  

const loadOTP = async(req,res)=>{

  const email = req.query.email
  console.log(email);
  res.render("otp-verification",{email:email})
}

const resendOTP =async (req,res)=>{
  const {email} =req.body
  await otp(email)
   res.json({success:true,email})
}
 
//======================================== OTP verification ============================================

const verifyOTP = async (req,res)=>{

  try{
    // const {email} = req.query
    const {hiddenEmail} = req.body
    const email = hiddenEmail
    const found = await otpModel.find({ email: { $eq: email } }).sort({_id:-1}).limit(1)
    // const otp = found[0].otp 
    if(found.length == 0){
      res.render("home")
    }
    else if(found){    
      const otp = found[0].otp 
     if(otp == req.body.otp){  
       await userModel.updateOne({email:email},{$set:{isVerified:true}})
      res.render('home');
 
    }else{
     res.render("otp-verification",{email})
    }
    }else{
     res.render("login")
    } 
    
  }catch(error){
    console.log(error);
  }
}
//=============================================
const loadLogin = (req,res)=>{
  
  res.render("login")
}
//=====================================
const verifyLogin = async(req,res)=>{
  try{
    
      email = req.body.loginEmail
      password = req.body.loginPassword
      const found = await userModel.findOne({email:email,isBlock:false,isAdmin:false,isVerified:true})
      if(found){
        const passwordMatch = await bcrypt.compare(
          password,
          found.password
     )
        if(passwordMatch){
          req.session.user_id = found._id  
          res.render("firstPage")
        }else{
        res.redirect("/login")
      }
    }else{
      res.redirect("/login")
    }
      }catch(error){  
      console.log(error);
    }
  
}

const loadProductList = async (req,res)=>{
  let isLoggedIn
    if(req.session.user_id){
       isLoggedIn = true
    }else{
      isLoggedIn = false
    }
  const find = await productModel.find({list:true}).populate("subcategory_id")
  const subcategory = await categoryModal.distinct("subcategory")
  const brand = await productModel.distinct("manufacturer")
  res.render("productList",{find,category:"All products",brand,subcategory,isLoggedIn})

}

//=========================================Load Men products on ===============================
const loadMen = async (req,res)=>{
 let isLoggedIn
    if(req.session.user_id){
       isLoggedIn = true
    }else{
      isLoggedIn = false
    }
    const find = await productModel.find({list:true}).populate({
      path: 'subcategory_id',
      match: { 'name': 'Men' } 
    });
    // Filter out documents where subcategory is null or didn't match the condition
    const filteredFind = find.filter(item => item.subcategory_id !== null);
    const brand = await productModel.distinct("manufacturer")
    const subcategory = await categoryModal.distinct("subcategory")
    res.render("productList", { find: filteredFind ,category:"Men's shoes",brand,subcategory,isLoggedIn});
 
  }
  
   
//=========================================Load women productspage===============================

const loadWomen = async (req,res)=>{
  let isLoggedIn
    if(req.session.user_id){
       isLoggedIn = true
    }else{
      isLoggedIn = false
    }
   const find = await productModel.find({list:true}).populate({
    path: 'subcategory_id',
    match: { 'name': 'Women' } 
  });

  const filteredFind = find.filter(item => item.subcategory_id !== null);
  const brand = await productModel.distinct("manufacturer")
  const subcategory = await categoryModal.distinct("subcategory")
  res.render("productList", { find: filteredFind,category:"Women's shoes" ,brand,subcategory,isLoggedIn});
  
}

//=========================================Load Kids products ===============================

const loadKids = async (req,res)=>{
  let isLoggedIn
    if(req.session.user_id){
       isLoggedIn = true
    }else{
      isLoggedIn = false
    }
   const find = await productModel.find({list:true}).populate({
    path: 'subcategory_id',
    match: { 'name': 'Kids' } 
  });

  
  const filteredFind = find.filter(item => item.subcategory_id !== null);
  const brand = await productModel.distinct("manufacturer")
  const subcategory = await categoryModal.distinct("subcategory")
   res.render("productList",{find:filteredFind,category:"Kids shoes",brand,subcategory,isLoggedIn})
}
 
//===================================Load product details page==========================================

const loadProductDetails = async(req,res)=>{
   const find = await  productModel.findOne({_id:req.query.id}).populate("subcategory_id")
    res.render("productDetails",{find})
}



//==========================================function for send OTP ======================================
  async function otp(email){
      const otp = otpGenerator.generate(4,{
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false
    })

    const otpDOC = new otpModel({
      email:email,
      otp:otp
    })

    await otpDOC.save()    
    

    const transporter = nodemailer.createTransport({
    host:process.env.MAIL_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user:  process.env.MAIL_USER,
    pass:  process.env.MAIL_PASS,
  },
});


// async..await is not allowed in global scope, must use a wrapper
async function main() {
  // send mail with defined transport object
 try{
    const info = await transporter.sendMail({
    from:  process.env.MAIL_USER, // sender address
    to: email, // list of receivers
    subject: "Here is your OTP", // Subject line
    text: otp, // plain text body
  });
  console.log("Message sent: %s", info.messageId);
}
catch(error){
  console.log(error);
}
}
main().catch(console.error);
}

  const userLogout = async (req, res) => {
    try {
       
         req.session.destroy((err) => {
              if (err) {
                   console.log('logout failed')
              } else {
                   res.redirect('/')
              }
         })
    } catch (error) {
         console.log(error)
    }
  }

  

const myAccount = async (req,res)=>{

  const userId = req.session.user_id
  const find = await userModel.findOne({_id:userId})
  const orders = await orderModal.find({})
  res.render("myAccount",{find,orders})

}
const editUser = async (req,res)=>{

  const {name,email,phone,userId} = req.body
  const find = await userModel.findOne({_id:userId})
  const oldEmail = find.email
  await userModel.updateOne({_id:userId},{$set:{name:name,phone:phone,email:email}})

   if(email !== oldEmail){
    console.log("different email found");
      await otp(email)
      res.json({success:true,message:"otpSend",email})
  }

}   

  
const addAddress = async (req,res)=>{

try{
   const {name,phone,building,city,district,state,pincode} = req.body
   const userId = req.session.user_id
   await userModel.updateOne(    
          {_id:userId},
          {
            $push:{
              address:{
                name:name,
                phone:phone,
                building:building,
                city:city,
                district:district,
                state:state,
                pincode:pincode
  }}})  

  res.status(200).json({ message: "Address added successfully" });
}catch(error){
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}

}
 

const loadEditAddress = async (req,res)=>{

    const addressId = req.params.id;
    const id =  req.session.user_id;
    const find = await userModel.findOne({_id:id})
    
    const address =find.address.find((i)=> i._id == addressId)
    if (find) {
      // console.log("address",address);
      res.json(address);
    } else {
      res.status(404).json({ error: 'Address not found' });
    }
} 
   

const editAddress = async (req,res)=>{
  const  {name,phone,building,city,district,state,pincode,addressId} = req.body
  const id = req.session.user_id;
  
  await userModel.updateOne(
    { _id:id, "address._id":addressId },
    { $set: { "address.$.name":name ,
    "address.$.phone": phone,
    "address.$.building": building,
    "address.$.city": city,
    "address.$.district": district,
    "address.$.state": state,
    "address.$.pincode": pincode
  } }
  );

  res.json({ message: "Address added successfully" })
}

const deleteAddress = async (req,res)=>{
  const addressIdToDelete = req.body.addressId;
  const id = req.session.user_id
  await userModel.updateOne({_id:id},{$pull:{address:{_id:addressIdToDelete}}}) 
  res.json({success:"deletion success"})
}


const loadCart = async (req,res)=>{
 
  const userId = req.session.user_id
  const cart = await cartModal.findOne({userId:userId}).populate("product.productId")

  if (cart && cart.product) {
    for (const item of cart.product) {
      const quantity = item.quantity;
      const productPrice = item.productId.price; // Assuming "price" is the field in your product schema containing the product price

      const total = quantity * productPrice;

      // Update the total for the current product in the cart
      await cartModal.updateOne(
        { userId: userId, "product.productId": item.productId },
        { $set: { "product.$.total": total } }
      );

      
    }
  }

  const find = await cartModal.findOne({userId:userId}).populate("product.productId")
  const subtotal = await cartModal.aggregate([
  { $match: { $expr : { $eq: [ '$userId' , { $toObjectId: userId } ] } } },{$group:{_id:{subTotal: { $sum: "$product.total"}}}}
]);

  const cartSubtotal =subtotal[0]?._id?.subTotal; 
  await cartModal.updateOne({userId:userId},{$set:{subTotal:cartSubtotal}})
  const subTotal = await cartModal.findOne({userId:userId})
  
  res.render("cart",{find,subTotal})

}

 

const addTocart = async (req, res) => { 
 
  try {     
    const userId = req.session.user_id 
    const {productPrice,productId} = req.body
    const price = parseInt(productPrice)

    let userCart = await cartModal.findOne({ userId: userId });
  
    if (!userCart) {
    userCart = new cartModal(
      { userId: userId, 
       product:[ {     
        productId:productId, 
        total:price 
       }],
       subTotal:price

       });   
    await userCart.save()
    res.status(200).json({ success: true, message: 'Item added/updated to cart successfully' });
  }else{ 

    const find = await cartModal.find({
      'product.productId': productId
    });
    const subtotal = await cartModal.aggregate([
      { $match: { $expr : { $eq: [ '$userId' , { $toObjectId: userId } ] } } },{$group:{_id:{subTotal: { $sum: "$product.total"}}}}
    ]);
    
      const cartSubtotal =subtotal[0]?._id?.subTotal; 

    if(find.length == 0){
      await cartModal.updateOne(
        {userId: userId},
        {$push:{product:{ 
        productId:productId,
        total:price
        }}})  
        const subtotal = await cartModal.aggregate([
          { $match: { $expr : { $eq: [ '$userId' , { $toObjectId: userId } ] } } },{$group:{_id:{subTotal: { $sum: "$product.total"}}}}
        ]);
        
          const cartSubtotal =subtotal[0]?._id?.subTotal; 
          await cartModal.updateOne({userId:userId},{$set:{subTotal:cartSubtotal}})

        res.status(200).json({ success: true, message: 'Item added/updated to cart successfully' });

    }else{
      const find = await cartModal.find({ userId: userId, 'product.productId': productId })
      await cartModal.updateOne(
        { userId: userId, 'product.productId': productId },
        { $inc: { 'product.$.quantity': 1 ,'product.$.total':price,subTotal:price} }
      );
      res.status(200).json({ success: true, message: 'Item added/updated to cart successfully' });
    } 
  }
  } catch (error) { 
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};  


const updateCart = async (req,res)=>{

  const id = req.session.user_id;
  const {productId,quantity,productPrice} = req.body
  const total = quantity * productPrice
  
  

  await cartModal.updateOne({userId:id,'product.productId': productId},{$set:{'product.$.quantity':quantity,'product.$.total':total}})
  const subtotal = await cartModal.aggregate([
    { $match: { $expr : { $eq: [ '$userId' , { $toObjectId: id } ] } } },{$group:{_id:{subTotal: { $sum: "$product.total"}}}}
  ]);

  const cartSubtotal =subtotal[0]?._id?.subTotal; 
  await cartModal.updateOne({userId:id},{$set:{subTotal:cartSubtotal}})
  const find = await cartModal.findOne({userId:id})
  const subTotal =find.subTotal
  res.json({success:true,total,subTotal})

}  
 
const removeItem = async(req,res)=>{ 

  const id = req.session.user_id
  const {productId} = req.body
  await cartModal.updateOne({userId:id},{$pull:{product:{productId:productId}}})
  res.json({success:true})
}

const loadCheckout = async (req,res)=>{

  try{

    const id = req.session.user_id

    const find = await userModel.findOne({_id:id})
    
    const cartData = await cartModal.findOne({userId:id}).populate("product.productId")
    res.render("checkout",{find,cartData})
    }
    catch(error){
    console.error(error);

    }
}

const loadOrderSuccess = async (req,res)=>{
  // const find = await orderModal.findOne({}).populate({
  //   path: 'cartId',
  //   populate: [
  //     { path: 'userId', model: 'User' },
  //     { path: 'product.productId', model: 'products' }
  //   ]
  // }).exec();
 
  //  console.log(find.cartId.userId.name);
  res.render("orderSuccessPage")
} 



const order = async (req,res)=>{
  try{ 
    const id = req.session.user_id
    const {cartId,selectedAddress} = req.body

    const cart = await cartModal.findOne({userId:id})
    .populate('product.productId')

   
    const subTotal = cart.subTotal

  if (cart && cart.product) {

    const products = []

    for (const item of cart.product) {
      const quantity = item.quantity;
      const productPrice = item.productId.price; 
      const manufacturer = item.productId.manufacturer;
      const productName = item.productId.name; 
      const productTotal =item.total
      
     
      products.push({
        name: productName,
        manufacturer: manufacturer,
        quantity: quantity,
        price: productPrice,
        total: productTotal
    })

    }

    const order = new orderModal({
      userId: id,
      products: products,
      subTotal: subTotal,
      
})
    await order.save()
  }
  await cartModal.deleteOne({userId:id})

    res.status(200).json({ 
      success: true,
      message: 'Order placed successfully!',
  });
  }
  catch(error){
    console.error(error);
  }
}

   
module.exports = {    

  loadHomePage,      
  loadsignup, 
  signup,     
  loadOTP,    
  verifyOTP,
  loadLogin,
  verifyLogin,  
  loadProductList,
  loadMen,  
  loadWomen,
  loadKids, 
  loadProductDetails,
  userLogout,    
  loadCart,
  addTocart,
  myAccount,
  addAddress,
  loadEditAddress,
  editAddress,
  deleteAddress,
  updateCart,
  removeItem,
  loadCheckout,
  order,
  loadOrderSuccess,
  resendOTP,
  editUser
}