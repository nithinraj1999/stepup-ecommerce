const userModel = require("../Models/userModel")

const loginLoad = (req, res) => {
  res.render("adminLogin");
};


const verifyLogin = async (req,res)=>{
  let email = req.body.email
  let password = req.body.password
  const find = await userModel.findOne({email:email,isAdmin:true})
  if(find) {
    if(find.password == password){
      res.render("adminDashboard")
    }else{
      console.log("Failed");
      res.render("adminLogin")
    }
  }else{
    console.log("failed");
    res.render("adminLogin")
  }
}
 
const loadUser = async (req,res)=>{
  const find = await userModel.find({isAdmin:false})
  res.render("allUsers",{find})
}


const restrict = async (req,res)=>{
  const id = req.query.id
  const find = await userModel.findOne({_id:id})  
  if(find.isBlock==false){
     const found = await userModel.updateOne({_id:id},{$set:{isBlock:true}})     
       res.render("allUsers",{})     
  }else{ 
     const found = await userModel.updateOne({_id:id},{$set:{isBlock:false}})
      res.render("allusers")
  }
}

const loadCategory = (req,res)=>{
  res.render("category")
}



module.exports = { loginLoad,verifyLogin,loadUser,restrict,loadCategory};
