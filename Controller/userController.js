const otpGenerator = require("otp-generator")
const userModel = require("../Models/userModel")
const otpModel = require("../Models/otpModel")
const nodemailer = require("nodemailer")
const productModel = require("../Models/productModel")
const cartModal = require("../Models/cartModal")
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
    res.render("home")
}

const loadsignup = (req,res)=>{
    res.render("login")
}

const signup = async (req,res)=>{
  const {email} = req.body
  const checkEmail = await userModel.find({email:email})
  if(checkEmail==0){
    const spassword = await securePassword(req.body.password)
    const userDoc = new userModel({
        name:req.body.name,
        email:req.body.email,
        phone:req.body.phone,
        password:spassword
    })

    await userDoc.save()
    await otp(email)
    res.render("otp-verification",{email})

}else{
  res.render("login")
}
}

const loadOTP = (req,res)=>{
  const {email} = req.query
  otp(email)
  res.render("otp-verification",{email})
}

//========================================OTP verification============================================
const verifyOTP = async (req,res)=>{
  try{
    const {email} = req.query
    const found = await otpModel.find({ email: { $eq: email } }).sort({_id:-1}).limit(1)
    // const otp = found[0].otp 
    if(found.length == 0){
      res.render("home")
    }
    else if(found){
      const otp = found[0].otp 
     if(otp == req.body.otp){  
       await userModel.updateOne({email:email},{$set:{isVerified:true}})
       res.render("home")
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
  const find = await productModel.find({list:true}).populate("subcategory_id")
  res.render("productList",{find,category:"All products"})
}

//=========================================Load Men products on mens page===============================
const loadMen = async (req,res)=>{
   
  
    const find = await productModel.find({list:true}).populate({
      path: 'subcategory_id',
      match: { 'name': 'Men' } // Filter subcategory documents
    });
    // Filter out documents where subcategory is null or didn't match the condition
    const filteredFind = find.filter(item => item.subcategory_id !== null);
    res.render("productList", { find: filteredFind ,category:"Men's shoes"});
 
  }
  
   
//=========================================Load women products on mens page===============================
const loadWomen = async (req,res)=>{
   const find = await productModel.find({list:true}).populate({
    path: 'subcategory_id',
    match: { 'name': 'Women' } // Filter subcategory documents
  });

  // Filter out documents where subcategory is null or didn't match the condition
  const filteredFind = find.filter(item => item.subcategory_id !== null);

  res.render("productList", { find: filteredFind,category:"Women's shoes" });
  
}
//=========================================Load Kids products on mens page===============================
const loadKids = async (req,res)=>{
   const find = await productModel.find({list:true}).populate({
    path: 'subcategory_id',
    match: { 'name': 'Kids' } // Filter subcategory documents
  });

  // Filter out documents where subcategory is null or didn't match the condition
  const filteredFind = find.filter(item => item.subcategory_id !== null);

   res.render("productList",{find:filteredFind,category:"Kids shoes"})
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

  const loadCart = async (req,res)=>{
    const userId = req.session.user_id
    const find = await cartModal.findOne({userId:userId}).populate("product.productId")
  
    
    res.render("cart",{find})
  }

  const addTocart = async (req, res) => {

    try {
      const productId = req.body.productId; 
      const userId = req.session.user_id 
     
 
      let userCart = await cartModal.findOne({ userId: userId });
      if (!userCart) {
      userCart = new cartModal(
        { userId: userId,
         product:[ {
          productId:productId,
          
         }]
         });
      await userCart.save()
      res.status(200).json({ success: true, message: 'Item added/updated to cart successfully' });
    }else{ 

      const find = await cartModal.find({
        'product.productId': productId
      });

      
      if(find.length == 0){
        await cartModal.updateOne(
          {userId: userId},
          {$push:{product:{ 
          productId:productId
          }}}) 
          res.status(200).json({ success: true, message: 'Item added/updated to cart successfully' });
      }else{

        await cartModal.updateOne(
          { userId: userId, 'product.productId': productId },
          { $inc: { 'product.$.quantity': 1 } }
        );
        res.status(200).json({ success: true, message: 'Item added/updated to cart successfully' });
      }
    }
    } catch (error) { 
      console.error('Error adding to cart:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };
   

const myAccount = async (req,res)=>{

  const userId = req.session.user_id
  const find = await userModel.findOne({_id:userId})
  res.render("myAccount",{find})
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
  deleteAddress
 
}