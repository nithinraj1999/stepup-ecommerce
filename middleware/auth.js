const userModel = require("../Models/userModel")


const isLogin = async (req,res,next)=>{
    try{
        const userId = req.session.user_id
        if(userId){

            const user = await userModel.findOne({_id:userId})

            if(user.isBlock == true){
                res.redirect("/")
            }

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

module.exports = {
    isLogin,
    isLogout
}