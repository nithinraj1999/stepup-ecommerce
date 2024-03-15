const otpGenerator = require("otp-generator")
const userModel = require("../Models/userModel")
const categoryModal = require("../Models/categoryModel")
const otpModel = require("../Models/otpModel")
const nodemailer = require("nodemailer")
const productModel = require("../Models/productModel")
const cartModal = require("../Models/cartModal")
const orderModal = require("../Models/orderModel")
const wishListModel = require("../Models/wishListModel")
const walletModel = require("../Models/walletModel")
const Swal = require('sweetalert2');
const mongoose = require('mongoose');
const {v4:uuidv4} = require('uuid')
const Razorpay = require("razorpay")
require('dotenv').config()
const bcrypt = require('bcrypt')
const crypto = require("crypto")
const coupenModel = require("../Models/coupenModel")

var instance = new Razorpay(
  { 
    key_id: 'rzp_test_EXuX7ue9wXyfnc', 
    key_secret: 'BnbkfGmhHXITc2ZOkHCgfk1M' 
  })
 

const securePassword = async (password) => {
  try {
       const passwordHash = await bcrypt.hash(password, 10)
       return passwordHash
  } catch (error) {
       console.error(error)
  }
}

const loadHomePage = (req,res)=>{
  let isLoggedIn
    if(req.session.user_id){
       isLoggedIn = true
    }else{
      isLoggedIn = false
    }
  if(req.session.user_id){
    res.render("home",{isLoggedIn})
  }else{
    res.render("home",{isLoggedIn})
  }
   
}
 
const loadsignup = (req,res)=>{
    res.render("login")
}


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
    let isLoggedIn
    if(req.session.user_id){
       isLoggedIn = true
    }else{ 
      isLoggedIn = false
    }
    const {hiddenEmail} = req.body
    const email = hiddenEmail
    const found = await otpModel.find({ email: { $eq: email } }).sort({_id:-1}).limit(1)
   
    if(found.length == 0){
      res.render("home",{isLoggedIn})
    }

    else if(found){
      const otp = found[0].otp 
     if(otp == req.body.otp){  
       await userModel.updateOne({email:email},{$set:{isVerified:true}})
       res.render('home',{isLoggedIn});
 
    }else{
      req.flash('message', 'Invalid OTP. Please try again.');
      const message = req.flash('message')
     res.render("otp-verification",{email,message:message })
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
  let isLoggedIn
    if(req.session.user_id){
       isLoggedIn = true
    }else{
      isLoggedIn = false
    }
  
  res.render("login",{isLoggedIn})
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
          res.redirect("/")
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
  try{
    const userId = req.session.user_id
    let isLoggedIn
      if(req.session.user_id){
         isLoggedIn = true
      }else{
        isLoggedIn = false
      }
    const find = await productModel.find({list:true}).populate("subcategory_id")
    const subcategory = await categoryModal.distinct("subcategory")
    const brand = await productModel.distinct("manufacturer")
    const wishList = await wishListModel.findOne({userId:userId})
    const cart = await cartModal.findOne({userId:userId})
    // res.render("productList",{find,category:"All products",brand,subcategory,isLoggedIn,wishList})
    res.render("productGrid",{find,category:"All products",brand,cart,subcategory,isLoggedIn,wishList,cat:"all"})
  }
  catch(error){
    console.error(error);  
  }
  
 
} 

//=========================================Load Men products on ===============================
const loadMen = async (req,res)=>{
  try{

  
  const userId = req.session.user_id
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
    const filteredFind = find.filter(item => item.subcategory_id !== null);
    const brand = await productModel.distinct("manufacturer")
    const subcategory = await categoryModal.distinct("subcategory")
    const wishList = await wishListModel.findOne({userId:userId})
    const cart = await cartModal.findOne({userId:userId})
    res.render("productGrid",{find: filteredFind,cart,category:"Men's shoes",brand,subcategory,isLoggedIn,wishList,cat:"Men"})

  }
  catch(error){
    console.error(error);
  }
  }
  
   
//=========================================Load women productspage===============================

const loadWomen = async (req,res)=>{
  try{

  
  const userId = req.session.user_id
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
  const wishList = await wishListModel.findOne({userId:userId})  
  const cart = await cartModal.findOne({userId:userId})

  // res.render("productList", { find: filteredFind,category:"Women's shoes" ,brand,subcategory,isLoggedIn,wishList});
  res.render("productGrid",{find: filteredFind,cart,category:"Women's shoes",brand,subcategory,isLoggedIn,wishList,cat:"Women"})


}
catch(error){
  console.error(error);
}
}

//=========================================Load Kids products ===============================

const loadKids = async (req,res)=>{
try{


  const userId = req.session.user_id
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
  const wishList = await wishListModel.findOne({userId:userId})
  const cart = await cartModal.findOne({userId:userId})

  //  res.render("productList",{find:filteredFind,category:"Kids shoes",brand,subcategory,isLoggedIn,wishList})
  res.render("productGrid",{find:filteredFind,cart,category:"Kids shoes",brand,subcategory,isLoggedIn,wishList,cat:"Kids"})

}
catch(error){
  console.error(error);
}
}  
  
//===================================Load product details page==========================================

const loadProductDetails = async(req,res)=>{
  const userId = req.session.user_id
   const find = await  productModel.findOne({_id:req.query.id}).populate("subcategory_id")
   const wishList = await wishListModel.findOne({userId:userId})
    res.render("productDetails",{find,wishList})
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

try{

  const userId = req.session.user_id
  const find = await userModel.findOne({_id:userId})
  const orders = await orderModal.find({userId:userId}).sort({_id:-1})
  const wallet = await walletModel.findOne({userId:userId})

  res.render("myAccount",{find,orders,wallet})
}
catch(error){
  console.error(error);
}
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
      
      res.status(200).json({ success: true, message: 'Item added/updated to cart successfully' });
    } 
  }
  } catch (error) { 
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};  



const updateCart = async (req,res)=>{

try{
  const id = req.session.user_id;
  const {productId,quantity,productPrice} = req.body
  
  const total = quantity * productPrice
  let warningMsg
  
  await cartModal.updateOne({userId:id,'product.productId': productId},{$set:{'product.$.quantity':quantity,'product.$.total':total}})
  const subtotal = await cartModal.aggregate([
    { $match: { $expr : { $eq: [ '$userId' , { $toObjectId: id } ] } } },{$group:{_id:{subTotal: { $sum: "$product.total"}}}}
  ]);

  const cartSubtotal =subtotal[0]?._id?.subTotal; 
  await cartModal.updateOne({userId:id},{$set:{subTotal:cartSubtotal}})
  const find = await cartModal.findOne({userId:id}).populate("product.productId")
  const subTotal =find.subTotal
  const productItem = find?.product?.find(item => item.productId._id == productId);
  const f = await cartModal.findOne({userId:id}).populate("product.productId")
  if (productItem && productItem.productId.quantity == quantity) {
    warningMsg = true;
  } else { 
    warningMsg = false;
  }
  res.json({success:true,total,subTotal,warningMsg})
}   
catch(error){
  console.error(error);
}    
}  
  
const removeItem = async(req,res)=>{ 
  try{
    const id = req.session.user_id
    const {productId} = req.body
    await cartModal.updateOne({userId:id},{$pull:{product:{productId:productId}}})
    res.json({success:true})
  }
  catch(error){
    console.error(error);
  }
}

const loadCheckout = async (req,res)=>{
  try{

    const id = req.session.user_id
    const find = await userModel.findOne({_id:id})
    const cartData = await cartModal.findOne({userId:id}).populate("product.productId")
    const wallet = await walletModel.findOne({userId:id})
    const coupens = await coupenModel.find({})
    res.render("checkout",{find,cartData,wallet,coupens})
    }
  catch(error){
    console.error(error);
    }
}

const loadOrderSuccess = async (req,res)=>{
  res.render("orderSuccessPage")
} 

function generateUniqueID(length) {
  const uuid = uuidv4().replace(/-/g, ''); // Remove dashes from the UUID
  return uuid.substring(0, length);
}


const checkOutVerification = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const cartData = await cartModal.findOne({ userId: userId }).populate("product.productId");

    for (const item of cartData.product) {
      const product = item.productId;
      
      if (item.quantity > product.quantity) {
        console.error(`Error: Quantity of product '${product.name}' is insufficient.`);
        return res.status(400).json({ error: `Quantity of product '${product.name}' is insufficient.`});
      }
    }
 
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const order = async (req,res)=>{
  try{ 
    const id = req.session.user_id
    const {cartId,selectedAddress,selectedPaymentMethod,total,coupencode} = req.body
    console.log(req.body);
    if(coupencode){
      await coupenModel.updateOne({coupenCode:coupencode},{$push:{users:{userID:id}}})
    }else{
      console.log("no coupen");
    }

    const uniqueOrderId = generateUniqueID(5);
    const cart = await cartModal.findOne({userId:id}).populate('product.productId')

    const subTotal = cart.subTotal 
    if(selectedPaymentMethod == "COD"){

      if (cart && cart.product) {
        const products = [] 
        for (const item of cart.product) {
          const quantity = item.quantity;
          const productPrice = item.productId.price; 
          const manufacturer = item.productId.manufacturer;
          const productName = item.productId.name; 
          const productTotal =item.total;
          const productImage = item.productId.product_image[3].resizedFile
          const productId = item.productId
          
          products.push({
            name: productName,
            manufacturer: manufacturer,
            productId:productId,
            quantity: quantity,
            price: productPrice,
            total: productTotal,
            productImage:productImage
        })
    
        await productModel.updateOne({_id:productId},{$inc:{quantity:-quantity}})
    
      }
    
        const order = new orderModal({
          userId: id,
          products: products,
          addressId:selectedAddress,
          subTotal: total,
          order_id:uniqueOrderId,
          paymentMethod:selectedPaymentMethod
    })
    
        await order.save() 
    
        const orderId = order._id
        const orderTotal = order.subTotal
    
    
        await cartModal.deleteOne({userId:id})  
        res.status(200).json({codSuccess: true,message: 'Order placed successfully!'});
    }
    

  }else if(selectedPaymentMethod == "online"){

    if (cart && cart.product) {
      const products = [] 
      for (const item of cart.product) {
        const quantity = item.quantity;
        const productPrice = item.productId.price; 
        const manufacturer = item.productId.manufacturer;
        const productName = item.productId.name; 
        const productTotal =item.total;
        const productImage = item.productId.product_image[3].resizedFile
        const productId = item.productId
        
        products.push({
          name: productName,
          manufacturer: manufacturer,
          productId:productId,
          quantity: quantity,
          price: productPrice,
          total: productTotal,
          productImage:productImage
        })

      //  await productModel.updateOne({_id:productId},{$inc:{quantity:-quantity}})

    }
  
      const order = new orderModal({
        userId: id,
        products: products,
        addressId:selectedAddress,
        subTotal: total,
        order_id:uniqueOrderId,
        paymentMethod:selectedPaymentMethod
  })
  
      await order.save()
        const orderId = order._id
        const orderTotal = order.subTotal
 
        const razorpayInstance = await generaterazorpay(orderId,orderTotal)

        res.json({ razorpayInstance})
}
   
}else if(selectedPaymentMethod =="wallet"){

  if (cart && cart.product) {
    const products = [] 
    for (const item of cart.product) {
      const quantity = item.quantity;
      const productPrice = item.productId.price; 
      const manufacturer = item.productId.manufacturer;
      const productName = item.productId.name; 
      const productTotal =item.total;
      const productImage = item.productId.product_image[3].resizedFile
      const productId = item.productId
      
      products.push({
        name: productName,
        manufacturer: manufacturer,
        productId:productId,
        quantity: quantity,
        price: productPrice,
        total: productTotal,
        productImage:productImage
      })

      await productModel.updateOne({_id:productId},{$inc:{quantity:-quantity}})

  }

    const order = new orderModal({
      userId: id,
      products: products,
      addressId:selectedAddress,
      subTotal: total,
      order_id:uniqueOrderId,
      paymentMethod:selectedPaymentMethod
})

    await order.save()
      const orderId = order._id
      const orderTotal = order.subTotal

     await walletModel.updateOne({userId:id},{$inc:{balance:-orderTotal},$push:{transactions:{amount:orderTotal,type:"Debit"}}})



      await cartModal.deleteOne({userId:id})  
      res.status(200).json({codSuccess: true,message: 'Order placed successfully!'});
}
 
}
  else{
    res.json({message:"error"})
  }
  
  }
  catch(error){
    console.error(error);
  }   
}

//=====================function to generate Razorpay ===================

function generaterazorpay(orderId,totalPrice){
  
  const options= instance.orders.create({
    amount: totalPrice * 100,
    currency: "INR",
    receipt: orderId,
    })
    return options
}

//======================================================================


const verifyPayment = async (req,res)=>{
  
  try{

    const {payment,order: orderData} =req.body
    let hmac = crypto.createHmac('sha256', 'BnbkfGmhHXITc2ZOkHCgfk1M');
    hmac.update(payment.razorpay_order_id +"|"+ payment.razorpay_payment_id)
    hmac = hmac.digest('hex')

    if(hmac == payment.razorpay_signature){
      const orderId = orderData.razorpayInstance.receipt
      const order = await orderModal.findOne({_id:orderId})
      const userId = order.userId
      if(order){

        await cartModal.deleteOne({userId:userId}) 

          for (const item of order.products) {
            const quantity = item.quantity;
            const productId = item.productId;
            await productModel.updateOne({_id:productId},{$inc:{quantity:-quantity}})
        }
          res.status(200).json({onlinePaymentsuccess: true,message: 'Order placed successfully!'});
      }else{
        res.json({message:"cannot find order document"})
      }
  }else{
 
    console.log("signature isnt matching");


    res.json({message:"payament signature isnt matching"})
  }
  } 
  catch(error){
    console.error(error);
  }
  }
  //======================

  const failedPayment = async (req,res)=>{
    try{
      const {payment, order: orderData} = req.body
      const orderId = orderData.razorpayInstance.receipt
      const del =await orderModal.deleteOne({_id:orderId})
      console.log(del);
      res.json({success:true})
    }
    catch(error){
      console.error(error);
    }
     
  }

  const paymentFailed = (req,res)=>{
    try{
      res.render("paymentFailedPage")
    }
    catch(error){
      console.error(error);
    }
  }

//========
const orderDetails = async (req,res)=>{

  try{
 
    const orderId = req.query.orderId
    const productId = req.query.productId  
    const userId = req.session.user_id
    const order = await orderModal.findOne({_id:orderId,userId:userId})
    const addressId = order.addressId
    const user = await userModel.findOne({_id:userId})
    const product = order.products.find(p => p._id.toString() === productId);
    const address = user.address.find(address =>address._id.toString() === addressId)
    const otherItems = order.products.filter(p => p._id.toString() !== productId);  
    
    res.render("orderDetails",{product,address,otherItems,order}) 
  }catch(error){
    console.error(error);
  } 
}

// const p = async (req,res)=>{
//   try{
  
//   const userId = req.session.user_id
//   let isLoggedIn
//     if(req.session.user_id){ 
//        isLoggedIn = true
//     }else{
//       isLoggedIn = false
//     }
//   const find = await productModel.find({list:true}).populate("subcategory_id")
//   const subcategory = await categoryModal.distinct("subcategory")
//   const brand = await productModel.distinct("manufacturer")
//   const wishList = await wishListModel.findOne({userId:userId})
//   res.render("productGrid",{find,category:"All products",brand,subcategory,isLoggedIn,wishList})
//   }
//   catch(error){
//     console.error(error);
//   }
   
// } 


const cancelRequest = async (req,res)=>{

try{ 
  const userId = req.session.user_id
  const {productId,orderId,reason} = req.body
  await orderModal.updateOne(
    {_id:orderId,userId:userId,"products._id":productId},
    {
      $set:{"products.$.orderStatus": "Canceled",reason:reason}
    })

    
  const order =  await orderModal.findOne({_id:orderId,userId:userId})

  const cancelledProduct = order.products.find(item => item._id == productId)
  const cancelledProductId = cancelledProduct.productId
  const quantityOfCanceled = cancelledProduct.quantity
  const priceOfCanceled = cancelledProduct.price
  const totalPriceOfCancelled = quantityOfCanceled * priceOfCanceled
  const paymentMethod = order.paymentMethod
 
  console.log("payment menthod"+paymentMethod);

  await productModel.updateOne({_id:cancelledProductId},{$inc:{quantity:quantityOfCanceled}})
 
  
  if(order.paymentMethod == "wallet" ||order.paymentMethod == "online"){
    const wallet = await walletModel.findOne({userId:userId})
  if(!wallet){
    const addBalaceToWallet = new walletModel({
    userId:userId,
    balance:priceOfCanceled,
    transactions:[{
      amount:totalPriceOfCancelled,
    }]
  })

  await addBalaceToWallet.save()

  }else{

    await walletModel.updateOne({userId:userId},{$inc:{balance:totalPriceOfCancelled},$push:{transactions:{amount:totalPriceOfCancelled}}})

  }
  }
  
    
  res.json({success:true})

}
catch(error){ 
  console.error(error);
} 
}  
 

const returnRequest = async (req,res)=>{ 
  try{
    const userId = req.session.user_id
    const {productId,orderId,reason} = req.body
    await orderModal.updateOne(
      {_id:orderId,userId:userId,"products._id":productId},
      {
        $set:{"products.$.orderStatus": "Requested Return",reason:reason}
      })
      res.json({success:true})
  
  }catch(error){
    console.error(error);
  }
}




const addToWishList = async (req,res)=>{

  try{
    const userId = req.session.user_id
    const {productId} = req.body
    const wishList = await wishListModel.findOne({userId:userId})
    if(!wishList){
      const wishList = new wishListModel({
        userId:userId,
        product:[{ 
          productId:productId
        }]
      })

      await wishList.save()
 
    }else{

      const isProductExists = wishList.product.find(item => item.productId.equals(productId));
      if(!isProductExists){
        await wishListModel.updateOne( {userId:userId},{$push:{product:{productId:productId}}});
      }else{
        await wishListModel.updateOne( {userId:userId},{$pull:{product:{productId:productId}}});
      }
    }

    const find = await wishListModel.findOne({userId:userId})
    const checkIsThereProductID = find.product.find(item => item.productId.equals(productId));
    
    res.json({success:true,checkIsThereProductID}) 

  }catch(error){
    console.error(error);
  }
}


const loadWishList = async (req,res)=>{
  try{
    let isLoggedIn = req.session.user_id ? true : false;
    const userId = req.session.user_id
    const wishList = await wishListModel.findOne({userId:userId}).populate("product.productId")
    res.render("wishList",{wishList,isLoggedIn})
}
catch(error){ 
  console.error(error);
}
}


const removeWishList = async (req,res)=>{
  try{
  const userId = req.session.user_id
  const {productId} = req.body
 await wishListModel.updateOne({userId:userId},{$pull:{product:{productId:productId}}})

  res.json({success:true})
  }
  catch(error){
    console.error(error);
  }
}



const applyCoupen =  async(req,res)=>{
  try{
    const userId = req.session.user_id
    const {coupencode} = req.body
    const cart =  await cartModal.findOne({userId:userId})
    const coupen = await coupenModel.findOne({coupenCode:coupencode})
    const couponAlreadyUsed = coupen?.users?.find((user)=> user.userID == userId )
    let subTotal = cart.subTotal
    if(couponAlreadyUsed){
      res.json({success:true,alreadyused:true,message:"Coupen Already Used",subTotal:subTotal})
    }else{
      const {discount,validUntill,minPurchaseAmount} = coupen
      
      console.log(coupen);
      if(subTotal >=minPurchaseAmount && validUntill >Date.now()){
      discountamount = subTotal*discount/100
      subTotal = subTotal - discountamount
      res.json({success:true,subTotal:subTotal})
    }else{
      res.json({message:"Cannot apply coupen",subTotal:subTotal})
    }

   
    }
    

  }  
  catch(error){ 
    console.error(error); 
  }
} 
    

// const sortByPrice = async (req,res)=>{
//   try{
//     const {value,category} = req.query
//     const userId = req.session.user_id
//     let filteredFind
//     let find;
//     let title
//     console.log(req.query);
//     let isLoggedIn
//       if(req.session.user_id){
//          isLoggedIn = true
//       }else{
//         isLoggedIn = false
//       }
//       if(category == "all" ){
//          find = await productModel.find({list:true}).populate("subcategory_id").sort({price: parseInt(value)})
//          title ="All products"
//       }else{
//           find = await productModel.find({list:true}).populate({
//           path: 'subcategory_id',
//           match: { 'name': `${category}`} 
//         }).sort({price: parseInt(value)}) 
//         title = `${category} shoes`
//         filteredFind = find.filter(item => item.subcategory_id !== null);
//         find =filteredFind
//       }
   
//     const subcategory = await categoryModal.distinct("subcategory")
//     const brand = await productModel.distinct("manufacturer")
//     const wishList = await wishListModel.findOne({userId:userId})
//     res.render("productGrid",{find,category:`${title}`,brand,subcategory,isLoggedIn,wishList,cat:`${category}`})
//   }
//   catch(error){
//     console.error(error);
//   }   
// }    
 

 


const loadProduct = async (req,res)=>{

    try{
    const userId = req.session.user_id
    let isLoggedIn
      if(req.session.user_id){
         isLoggedIn = true
      }else{
        isLoggedIn = false
      }


    const find = await productModel.find({list:true}).populate("subcategory_id").sort({price:-1})
    const subcategory = await categoryModal.distinct("subcategory")
    const brand = await productModel.distinct("manufacturer")
    const wishList = await wishListModel.findOne({userId:userId})
    res.render("productGrid",{find,category:"All products",brand,subcategory,isLoggedIn,wishList})
    
  }
  catch(error){
    console.error(error);
  }
}


// const filter = async (req, res) => {
//   try {
//       const userId = req.session.user_id;
//       const isLoggedIn = req.session.user_id ? true : false;

//       const { category, brand: manufacturer, sort, mainCategory } = req.query;
//       console.log(req.query);

//       const filter = {
//           list: true
//       };

//       if (manufacturer && Array.isArray(manufacturer)) {
//           filter.manufacturer = { $in: manufacturer }; // Use the array directly
//       } else if (manufacturer) {
//           // Handle the case where manufacturer is a single value
//           filter.manufacturer = manufacturer;
//       }
//       if (category) {
//           // Populate the 'subcategory_id' field to access the category information
//           filter.subcategory_id = { $in: await categoryModal.find({ subcategory: category }) };
//       }

//       // Include filtering based on the main category if available
//       if (mainCategory && mainCategory !== "all") {
//           // Assuming 'mainCategory' corresponds to a field in your product model
//           filter.subcategory_id = { $in: await categoryModal.find({ name: mainCategory }) };
//       }

//       // Query MongoDB to find products that meet the filter criteria
//       let find;
//       if (mainCategory === "all") {
//         title ="All products"
//           find = await productModel.find(filter).populate("subcategory_id");
//       } else {
//           find = await productModel.find(filter).populate({
//               path: 'subcategory_id',
//               match: { 'mainCategory': mainCategory }
//           });
//           title = `${category} shoes`
//       }

//       // if (sort == '-1') {
//       //     find = find.sort((a, b) => b.price - a.price);
//       // } else if (sort == '1') {
//       //     find = find.sort((a, b) => a.price - b.price);
//       // }
//       const subcategory = await categoryModal.distinct("subcategory");
//       const brand = await productModel.distinct("manufacturer");
//       const wishList = await wishListModel.findOne({ userId: userId });
//       res.render("productGrid", { find, category: title, brand, subcategory, isLoggedIn, wishList, cat: mainCategory });

//   } catch (error) {
//       console.error(error);
//   }
// }

// const filter = async (req, res) => {
//   try {
//       const userId = req.session.user_id;
//       const isLoggedIn = req.session.user_id ? true : false;

//       const { category, brand: manufacturer, sort, mainCategory } = req.query;
//       console.log(req.query);

//       const filter = {
//           list: true
//       };

//       if (manufacturer && Array.isArray(manufacturer)) {
//           filter.manufacturer = { $in: manufacturer }; // Use the array directly
//       } else if (manufacturer) {
//           // Handle the case where manufacturer is a single value
//           filter.manufacturer = manufacturer;
//       }
//       if (category) {
//           filter.subcategory_id = { 
//               $in: await categoryModal.find({ 
//                   subcategory: category, 
//                   ...(mainCategory && mainCategory !== "all" ? { name: mainCategory } : {})
//               })
//           };
//       }

//       // Query MongoDB to find products that meet the filter criteria
//       let find;
//       if (mainCategory === "all") {
//         title = "All products";
//         find = await productModel.find(filter).populate("subcategory_id");
//       } else {
//         find = await productModel.find(filter).populate({
//               path: 'subcategory_id',
//               match: { 'name': mainCategory }
//         });
//             title = `${mainCategory}'s shoes`;
//         // if(mainCategory == "Kids"){
//         //   title = "Kids shoes"
//         // }else{
//         //   title = `${mainCategory}'s shoes`;
//         // }
       
//       }

//       const subcategory = await categoryModal.distinct("subcategory");
//       const brand = await productModel.distinct("manufacturer");
//       const wishList = await wishListModel.findOne({ userId: userId });
//       res.render("productGrid", { find, category: title, brand, subcategory, isLoggedIn, wishList, cat: mainCategory });

//   } catch (error) {
//       console.error(error);
//   }
// }

// const filter = async (req, res) => {
//   try {
//       const userId = req.session.user_id;
//       const isLoggedIn = req.session.user_id ? true : false;

//       const { category, brand: manufacturer, sort, mainCategory } = req.query;
//       console.log(req.query);

//       const filter = {
//           list: true
//       };

//       if (manufacturer && Array.isArray(manufacturer)) {
//           filter.manufacturer = { $in: manufacturer }; // Use the array directly
//       } else if (manufacturer) {
//           // Handle the case where manufacturer is a single value
//           filter.manufacturer = manufacturer;
//       }

//       if (category) {
//           // If category is provided, filter based on category and mainCategory
//           filter.subcategory_id = { 
//               $in: await categoryModal.find({ 
//                   subcategory: category, 
//                   ...(mainCategory && mainCategory !== "all" ? { name: mainCategory } : {})
//               })
//           };
//       } else if (mainCategory && mainCategory !== "all") {
//           // If no category is provided, filter based only on mainCategory
//           filter.subcategory_id = { 
//               $in: await categoryModal.find({ name: mainCategory })
//           };
//       }

//       // Query MongoDB to find products that meet the filter criteria
//       let find;
//       if (mainCategory === "all") {
//         title = "All products";
//         find = await productModel.find(filter).populate("subcategory_id");
//       } else {
//         find = await productModel.find(filter).populate({
//               path: 'subcategory_id',
//               match: { 'name': mainCategory }
//         });
//         title = `${mainCategory}'s shoes`;
//       }

//       const subcategory = await categoryModal.distinct("subcategory");
//       const brand = await productModel.distinct("manufacturer");
//       const wishList = await wishListModel.findOne({ userId: userId });
//       res.render("productGrid", { find, category: title, brand, subcategory, isLoggedIn, wishList, cat: mainCategory });

//   } catch (error) {
//       console.error(error);
//   }
// }


const filter = async (req, res) => {
  try {
      const userId = req.session.user_id;
      const isLoggedIn = req.session.user_id ? true : false;

      const { category, brand: manufacturer, sort, mainCategory } = req.query;
   console.log(req.query);

      const filter = {
          list: true
      };

      if (manufacturer && Array.isArray(manufacturer)) {
          filter.manufacturer = { $in: manufacturer }; // Use the array directly
      } else if (manufacturer) {
          // Handle the case where manufacturer is a single value
          filter.manufacturer = manufacturer;
      }

      if (category) {
          // If category is provided, filter based on category and mainCategory
          filter.subcategory_id = { 
              $in: await categoryModal.find({ 
                  subcategory: category, 
                  ...(mainCategory && mainCategory !== "all" ? { name: mainCategory } : {})
              })
          };
      } else if (mainCategory && mainCategory !== "all") {
          // If no category is provided, filter based only on mainCategory
          filter.subcategory_id = { 
              $in: await categoryModal.find({ name: mainCategory })
          };
      }

      // Query MongoDB to find products that meet the filter criteria
      let find;
      if (mainCategory === "all") {
        title = "All products";
        find = await productModel.find(filter).populate("subcategory_id");
      } else {
        find = await productModel.find(filter).populate({
              path: 'subcategory_id',
              match: { 'name': mainCategory }
        });
        title = `${mainCategory}'s shoes`;
      }

      const subcategory = await categoryModal.distinct("subcategory");
      const brand = await productModel.distinct("manufacturer");
      const wishList = await wishListModel.findOne({ userId: userId });
      res.render("productGrid", { find, category: title, brand, subcategory, isLoggedIn, wishList, cat: mainCategory });

  } catch (error) {
      console.error(error);
  }
}






const sortByPrice = async (req,res)=>{
 try{

  const userId = req.session.user_id;
      const isLoggedIn = req.session.user_id ? true : false;

      const { category, brand: manufacturer, sort, mainCategory } = req.query;
   
      console.log(sort);
      const filter = { 
          list: true
      };

      if (manufacturer && Array.isArray(manufacturer)) {
          filter.manufacturer = { $in: manufacturer }; // Use the array directly
      } else if (manufacturer) {
          // Handle the case where manufacturer is a single value
          filter.manufacturer = manufacturer;
      }

      if (category) {
          // If category is provided, filter based on category and mainCategory
          filter.subcategory_id = { 
              $in: await categoryModal.find({ 
                  subcategory: category, 
                  ...(mainCategory && mainCategory !== "all" ? { name: mainCategory } : {})
              })
          };
      } else if (mainCategory && mainCategory !== "all") {
          // If no category is provided, filter based only on mainCategory
          filter.subcategory_id = { 
              $in: await categoryModal.find({ name: mainCategory })
          };
      }

      // Query MongoDB to find products that meet the filter criteria
      let find;
      let sortOption = {};
        if (sort === "1") {
            sortOption = { price: 1 }; // Low to High
        } else if (sort === "-1") {
            sortOption = { price: -1 }; // High to Low
        }
      if (mainCategory === "all") { 
        title = "All products";

        find = await productModel.find(filter).populate("subcategory_id").sort(sortOption)
      } else {
        find = await productModel.find(filter).populate({
              path: 'subcategory_id',
              match: { 'name': mainCategory }
        }).sort(sortOption)
        title = `${mainCategory}'s shoes`;
      }

      const subcategory = await categoryModal.distinct("subcategory");
      const brand = await productModel.distinct("manufacturer");
      const wishList = await wishListModel.findOne({ userId: userId });
      res.render("productGrid", { find, category: title, brand, subcategory, isLoggedIn, wishList, cat: mainCategory });


 }catch(error){
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
  editUser,
  orderDetails,
  cancelRequest,
  returnRequest,
  addToWishList,
  loadWishList,
  removeWishList,
  verifyPayment,
  applyCoupen,
  loadProduct,
  sortByPrice,
  failedPayment,
  paymentFailed,
  checkOutVerification,
  filter,
  

} 