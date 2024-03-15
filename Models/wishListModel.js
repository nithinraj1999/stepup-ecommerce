const mongoose = require("mongoose")

const wishListSchema = mongoose.Schema({
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
        }
    }]
    
})

module.exports = mongoose.model("WishList",wishListSchema) 