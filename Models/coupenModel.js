const mongoose = require("mongoose")

const CoupenSchema = mongoose.Schema({
    coupenName:{
        type:String,
        required:true
    },
    coupenCode:{
        type:String,
        required:true
    },
    discount:{
        type:Number,  
        required:true
    },
    validFrom:{
        type:Date,
        required:true,
    },
    validUntill:{
        type:Date,
        required:true
    },
    minPurchaseAmount:{
        type:Number,
        required:true
    }, 
    users:[{
        userID:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        }
    }]    
       
})
  
module.exports = mongoose.model("coupen",CoupenSchema)