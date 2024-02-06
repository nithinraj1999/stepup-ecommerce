const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    password:{
        type:Number,
        required:true
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    isBlock:{
        type:Boolean,
        default:false
    },
    isVerified:{
        type:Boolean,
        default:false
    }
   
})

module.exports = mongoose.model("User",userSchema)
