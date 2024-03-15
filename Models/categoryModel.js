const mongoose = require("mongoose")

const categorySchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    subcategory:{
        type:String,
        required:true,        
    },
    description:{
        type:String,
        required:true
    },
    isBlock:{
        type:Boolean,
        default:false
    },
    offer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"offer"
    },
    
})
 

module.exports = mongoose.model("Category",categorySchema)