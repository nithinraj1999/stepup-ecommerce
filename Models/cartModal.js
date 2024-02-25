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
        total:{
            type:Number,
            require:true
        } 
     }], 
    subTotal:{
        type:Number,
        default:0
    }
    
})

module.exports = mongoose.model("cart",cartSchema)