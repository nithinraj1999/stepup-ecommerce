const mongoose = require("mongoose")

const cartSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    product:[{
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"products",
            required:true
        },
        
        quantity:{
            type:Number,
            default:1
        },
        price:{
            type:Number,
            require:true
        },
        total:{
            type:Number,
            require:true 
        } 
     }], 
     appliedCoupen:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"coupen",
     },
    subTotal:{   
        type:Number,
        default:0
    }
      
}) 

module.exports = mongoose.model("cart",cartSchema)