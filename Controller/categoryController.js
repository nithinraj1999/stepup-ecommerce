
const category = require("../models/categoryModel")
const offerModel = require("../models/offer")

const loadCategory = (req,res)=>{
    try{
        res.render("category", {alertMessage: null})
    }catch(error){
        console.error(error);
    }
   
}

const addCategory = async (req,res)=>{
    try{
        const {maincategory} = req.body
        const subcate =req.body.subcategory
        const {description} =req.body 
        subcategory = subcate.toLowerCase();
        const find = await category.find({name:maincategory,subcategory:subcategory})
        if(find.length ==0){
          const categoryCollection = new category({
            name:maincategory,
            subcategory:subcategory,
            description:description
        })
        await categoryCollection.save()
    //    res.render("category", {alertMessage: null});
    res.redirect("/admin/category")
        }else{
        
         res.render("category", {exist:"Category Already Exists"});
        }
    }catch(error){
        console.error(error);
    }
    
      
}

const loadEditCategory = async (req,res)=>{
    try{
        const find = await category.find({}).populate("offer")
        const offer = await offerModel.find({})
        res.render("editCategory",{find,offer})
    }catch(error){
        console.error(error);
    }
   
}

const editCategory = async (req,res)=>{ 
    try{
        const {action} = req.body
        const id = req.query.id 
        const offer = await offerModel.find({})
        if(action ==="block"){
          
           await category.updateOne({_id:id},{$set:{isBlock:true}})
           const find = await category.find({});
          res.render("editCategory",{find,offer})
      
        }else if(action === "unblock"){
         await category.updateOne({_id:id},{$set:{isBlock:false}})
          const find = await category.find({});
          res.render("editCategory",{find,offer})
      
        }else if(action === "delete"){
          await category.deleteOne({_id:id})
           const find = await category.find({});
           res.render("editCategory",{find,offer})
      
        }else if(action === "update"){
          const find = await category.findOne({_id:id})
          res.redirect(`/admin/updatecategory?id=${id}`)
        }else{  
          console.log("unknown button clicked");
        }
    }catch(error){
        console.error(error);
    }

  
}

const loadUpdateCategory = async (req,res)=>{
    try{
        const id = req.query.id 
        const find = await category.findOne({_id:id})
        res.render("updateCategory",{find})
    }catch(error){
        console.error(error);
    }
   
}

const updateCategory = async(req,res)=>{ 
    try{
        const id = req.query.id
        const {maincategory,subcategory,description} = req.body
        const lowerSubcategory = subcategory.toLowerCase()
        
        const find = await category.find({name:maincategory,subcategory:lowerSubcategory})
        if(find.length ==0){
            await category.updateOne({_id:id},{$set:{name:maincategory,subcategory:lowerSubcategory,description:description}})
            res.redirect("/admin/editcategory")
        }else{
            const find = await category.findOne({_id:id})
            res.render("updateCategory",{find,exist:"Category Already Exist"})
        } 
    }catch(error){
        console.error(error);
    } 
  
}


module.exports = {
    loadCategory,
    addCategory,
    loadEditCategory,
    editCategory,
    loadUpdateCategory,
    updateCategory
}