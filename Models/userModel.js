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
        type:String,
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
    },
    address:[{
        name:{
            type:String, 
            required:true
        },
        phone:{
            type:Number, 
            required:true
        },
        building:{
            type:String, 
            required:true
        },
        city:{
            type:String, 
            required:true
        },
        district:{
            type:String, 
            required:true
        },
        state:{
            type:String, 
            required:true
        },
        pincode:{
            type:Number, 
            required:true
        }

    }]
   
})

module.exports = mongoose.model("User",userSchema)
