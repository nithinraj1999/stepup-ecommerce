const mongoose = require("mongoose")

const otpSchema = mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:Number,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:60*1
    }
})

module.exports = mongoose.model("OTP",otpSchema)

