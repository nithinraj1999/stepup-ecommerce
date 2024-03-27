const userModel = require("../Models/userModel")


const isLogin = async (req,res,next)=>{
    try{
        const userId = req.session.user_id
        if(userId){

           
            next()
        }else{
            res.redirect("/")
        }
    }catch(error){
        console.log(error);
    }
}


const isLogout = async (req,res,next)=>{
    try{
        if(req.session.user_id){
            res.redirect("/home")
        next()
        }

    }catch(error){
        console.log(error);
    }
}

const isBlocked=async (req,res,next)=>{
    try{
        
        let check= await userModel.findById(req.session.user_id)

        if(req.session.user_id&&check.isBlock){
            req.session.user_id=null 
            res.redirect('/')
        }else{
            next()
        }

    }catch(err){
        console.log(err);
    }
}

module.exports = {
    isLogin,
    isLogout,
    isBlocked
}