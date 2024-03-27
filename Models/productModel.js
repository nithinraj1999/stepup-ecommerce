const mongoose = require("mongoose")
const { schema } = require("./userModel")

const productSchema = mongoose.Schema({
    
    name:{
        type:String,
        required:true,
    },
    subcategory_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    manufacturer:{
        type:String,
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    list:{
        type:Boolean,
        default:true
    },
    offer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"offer",
        
    },
    product_image:[
        {
                filename:{
                    type:String,
                    required:true
                },
                    path: {
                    type:String,
                    required:true
                },
                    resizedFile: {
                    type:String,
                    required:true,
                   
                    }
        }
    ]
})

 
module.exports = mongoose.model("products",productSchema)