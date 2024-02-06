const userModel = require("../Models/userModel")
const category = require("../Models/categoryModel")
const productModal = require("../Models/productModel")
const path = require("path")
const sharp = require("sharp")
const Swal = require("sweetalert2")
const loginLoad = (req, res) => {
  res.render("adminLogin");
};


const verifyLogin = async (req,res)=>{
  try{  
    let {email} = req.body
    let {password} = req.body
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
}catch(error){
  console.log(error.message);
}
}
 
const loadUser = async (req,res)=>{
  const find = await userModel.find({isAdmin:false})
  res.render("allUsers",{find})
}


const restrict = async (req,res)=>{
  const id = req.query.id
  let find = await userModel.findOne({_id:id})  
  if(find.isBlock==false){
     await userModel.updateOne({_id:id},{$set:{isBlock:true}})        
       res.redirect("/admin/user")          
  }else{ 
      await userModel.updateOne({_id:id},{$set:{isBlock:false}})
      res.redirect("/admin/user")      
  }
}

const loadCategory = (req,res)=>{
    res.render("category")
}

const addCategory = async (req,res)=>{
    const {maincategory} = req.body
    const {subcategory} =req.body
    const {description} =req.body
    const find = await category.find({name:maincategory,subcategory:subcategory})
    if(find.length ==0){
      const categoryCollection = new category({
        name:maincategory,
        subcategory:subcategory,
        description:description
    })
    await categoryCollection.save()
    res.render("category")
    }else{
      res.send("subcategory already exist")
    }
      
}

const loadEditCategory = async (req,res)=>{
    const find = await category.find({});
    res.render("editCategory",{find})
}

const editCategory = async (req,res)=>{ 
  // const find = await category.find({});
  const {action} = req.body
  const id = req.query.id 
  if(action ==="block"){
    
     await category.updateOne({_id:id},{$set:{isBlock:true}})
     const find = await category.find({});
    res.render("editCategory",{find})
  }else if(action === "unblock"){
   await category.updateOne({_id:id},{$set:{isBlock:false}})
    const find = await category.find({});
    res.render("editCategory",{find})
  }else if(action === "delete"){
    await category.deleteOne({_id:id})
     const find = await category.find({});
     res.render("editCategory",{find})
  }else if(action === "update"){
    const find = await category.findOne({_id:id})
    res.redirect(`/admin/updatecategory?id=${id}`)
  }else{  
    console.log("unknown button clicked");
  }
}

const loadUpdateCategory = async (req,res)=>{
   const id = req.query.id 
   const find = await category.findOne({_id:id})
   res.render("updateCategory",{find})
}

const updateCategory = async(req,res)=>{ 
  const id = req.query.id
  const {maincategory} = req.body
  const {subcategory} = req.body 
  const {description} = req.body 
  const find = await category.find({name:maincategory,subcategory:subcategory})
  if(find.length ==0){
      await category.updateOne({_id:id},{$set:{name:maincategory,subcategory:subcategory,description:description}})
      res.redirect("/admin/editcategory")
  }else{
    res.send("Already Exists")
  } 
}

const loadAddProduct = async (req,res)=>{
  const find = await category.find({})
  res.render("addProduct",{find})
}

const addProduct = async (req,res)=>{
    try{
      const {name,manufacturer,price,description,subcategory,maincategory,quantity} = req.body
      const  find  = await category.findOne({name:maincategory,subcategory:subcategory})
      const subcategory_id = find._id

const productImages = await Promise.all(req.files.map(async (file) => {
            try {
                console.log("promise is working");
                const resizedFilename = `resized-${ file.filename }`
                const resizedPath = path.join(__dirname, '../public/uploads',resizedFilename)
                              console.log("files",file);
                     
                await sharp(file.path)
                    .resize({ height: 500, width: 550, fit: 'fill' })
                    .toFile(resizedPath);

                return {
                    filename: file.filename,
                    path: file.path,
                    resizedFile: resizedFilename,

                };
            } catch (error) {
                console.error('Error processing and saving image:', error);
                return null; // Exclude failed images
            }
        }))


     
      const productCollection = new productModal({
        name:name,
        manufacturer:manufacturer,
        price:price,
        description:description,
        subcategory_id:subcategory_id,
        quantity:quantity,
        product_image:productImages
      })
      
      await productCollection.save()

      const populate = await productModal.find({}).populate("subcategory_id")
    
    }catch(error){
      console.log(error.message);
    }
    

    res.send("success")
}








module.exports = { loginLoad,verifyLogin,loadUser,restrict,loadCategory,addCategory,loadEditCategory,editCategory,loadUpdateCategory,updateCategory,loadAddProduct,addProduct};
