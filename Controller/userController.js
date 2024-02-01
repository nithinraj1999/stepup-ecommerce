const otpGenerator = require("otp-generator")
const userModel = require("../Models/userModel")
const otpModel = require("../Models/otpModel")
const nodemailer = require("nodemailer")
require('dotenv').config()

const loadHomePage = (req,res)=>{
    res.render("home")
}

const loadsignup = (req,res)=>{
    res.render("login")
}

const signup = async (req,res)=>{
  const email = req.body.email
  const checkEmail = await userModel.find({email:email})
  if(checkEmail==0){
    const userDOC = new userModel({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password
    })

    await userDOC.save()
    
    const otp = otpGenerator.generate(4,{
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false
    })

    const otpDOC = new otpModel({
      email:req.body.email,
      otp:otp
    })
    await otpDOC.save()    
    res.render("otp-verification",{email})
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
    to: req.body.email, // list of receivers
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
}else{
  res.render("login")
}
}

const loadOTP = (req,res)=>{
  res.render("otp-verification")

}

const verifyOTP = async (req,res)=>{
   const email = req.query.email
   const found = await otpModel.findOne({ email: { $eq: email } })
   const otp = found.otp
   if(found){
    if(otp == req.body.otp){     
     console.log(found);
     res.render("home")
   }else{
    res.render("otp-verification",{email})
   }
   }else{
    res.render("login")
   }
}

const loadLogin = (req,res)=>{
  res.render("login")
}

const verifyLogin = async(req,res)=>{
  email = req.body.loginEmail
  pass = req.body.loginPassword
  const found = await userModel.findOne({email:email})
  if(found.password ==pass){
    res.redirect("/")
  }else{
    res.redirect("/login")
  } 
}



  

module.exports = {loadHomePage,loadsignup,signup,loadOTP,verifyOTP,loadLogin,verifyLogin}