const isLogin = async (req,res,next)=>{
    try{

        if(req.session.admin_id){
            next()
        }else{
            res.redirect("/admin")
        }
    }catch(error){
        console.log(error);
    }
}


const isLogout = async (req,res,next)=>{
    try{
        if(req.session.admin_id){
            res.redirect("/")
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