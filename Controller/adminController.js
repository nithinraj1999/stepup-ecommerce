const userModel = require("../Models/userModel")
const category = require("../Models/categoryModel")
const productModal = require("../Models/productModel")
const path = require("path")
const sharp = require("sharp")
const Swal = require("sweetalert2")
const categoryModel = require("../Models/categoryModel")


const loginLoad = (req, res) => {
  if(req.session.admin_id){
    res.render("adminDashboard")
  }else{
    res.render("adminLogin");
  }
};

const verifyLogin = async (req,res)=>{
  try{  
    let {email} = req.body
    let {password} = req.body
    const find = await userModel.findOne({email:email,isAdmin:true})
    if(find) {
       if(find.password == password){
        req.session.admin_id = find._id
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



const logout = (req,res)=>{
  try {
       
    req.session.destroy((err) => {
         if (err) {
              console.log('logout failed')
         } else {
              res.redirect('/admin')
         }
    })
} catch (error) {
    console.log(error)
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
   res.render("category", {alertMessage: null});
    }else{
    
     res.render("category", {alertMessage:"already Exist"});
    }
      
}

const loadEditCategory = async (req,res)=>{
    const find = await category.find({});
    res.render("editCategory",{find})
}

const editCategory = async (req,res)=>{ 

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
  const {maincategory,subcategory,description} = req.body
  const lowerSubcategory = subcategory.toLowerCase()
  console.log(lowerSubcategory);
  const find = await category.find({name:maincategory,subcategory:lowerSubcategory})
  if(find.length ==0){
      await category.updateOne({_id:id},{$set:{name:maincategory,subcategory:lowerSubcategory,description:description}})
      res.redirect("/admin/editcategory")
  }else{
      const find = await category.findOne({_id:id})
      res.render("updateCategory",{find})
  } 
}    


const loadAddProduct = async (req,res)=>{
  const find = await category.distinct("subcategory")
  res.render("addProduct",{find})
}

const loadSubcategories = async (req,res)=>{
  const {mainCategory} = req.query
  const subcategory = await category.distinct("subcategory",{name:mainCategory})
  console.log(subcategory);
  res.status(200).json({ message: "Subcategories loaded successfully",subcategory});
}


//========================================Add product with image=============================
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
      
       
      const save =await productCollection.save() 

      // const populate = await productModal.find({}).populate("subcategory_id")    
    }catch(error){
      console.log(error); 
    }
    const find = await category.distinct("subcategory")
     res.render("addProduct",{find})
}


const allProducts = async(req,res)=>{

  try{
    const find = await productModal.find({}).populate("subcategory_id")
    res.render("allProducts",{find})
  }catch(error){
    console.log(error);
  }
} 





const editProducts = async (req,res)=>{

  try{
     const id = req.query.id 
    const {action} = req.body
    if(action == "list"){
     
      const find = await productModal.findOne({_id:id})
      if(find.list==true){
         await productModal.updateOne({_id:id},{$set:{list:false}})
         res.redirect("/admin/all-products")
      }else {
         await productModal.updateOne({_id:id},{$set:{list:true}})
         res.redirect("/admin/all-products")
      }
    }else if(action =="update"){
      res.redirect(`/admin/update-product?id=${id}`)
    }
    }catch(error){
    console.log(error);
    }
  
}

const loadUpdateProduct = async (req,res)=>{

  try{
      const id  = req.query.id
      const subcategory = await category.distinct("subcategory")
      const find = await productModal.findOne({_id:id}).populate("subcategory_id")
      res.render("updateProducts",{find,subcategory})
  }catch(error){
      console.log(error);
  }
}

const updateProduct = async(req,res)=>{
 
    try {

    const { id } = req.query;
    const { name, manufacturer, price, description, maincategory, subcategory,quantity } = req.body;

    
    console.log(req.body);
    const find= await category.findOne({name:maincategory,subcategory:subcategory})
    console.log(find);
    const productImages = await Promise.all(req.files.map(async (file) => {
      try {
          console.log("promise is working");
          const resizedFilename = `resized-${ file.filename }`
          const resizedPath = path.join(__dirname, '../public/uploads',resizedFilename)

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
    if(find){
      
      //    await productModal.updateOne(
      // { _id: id },
      // {
      //   $set: {
      //     name: name,
      //     manufacturer: manufacturer,
      //     price: price,
      //     description: description,
      //     subcategory_id:find._id,
      //     product_image:productImages,
      //     quantity:quantity
      //     }
      // })
      const updatedFields = {
        name: name,
        manufacturer: manufacturer,
        price: price,
        description: description,
        subcategory_id: find._id,
        quantity: quantity
      };
  
      if (productImages && productImages.length > 0) {
        updatedFields.product_image = productImages;
      }
  
      // Update the product
      const result = await productModal.updateOne({ _id: id }, { $set: updatedFields });
  
    }else{
      const subcategory1 = await category.distinct("subcategory")
      const find2 = await productModal.findOne({_id:id}).populate("subcategory_id")
      res.render("updateProducts",{find:find2,subcategory:subcategory1})
    }
    
      const subcategory1 = await category.distinct("subcategory")
      const find2 = await productModal.findOne({_id:id}).populate("subcategory_id")
      res.render("updateProducts",{find:find2,subcategory:subcategory1})
  } catch (error) {
    console.log(error); 
    res.status(500).send("Internal Server Error");
  }
};



const deleteimage = async (req,res)=>{

const {product_id,img_id} = req.query
 
  await productModal.updateOne(
    {_id:product_id},
    {
      $pull:{
        product_image:{
          _id:img_id
        }}
      })
 const find = await productModal.find({})
 res.redirect(`/admin/update-product?id=${product_id}`)
 

}

 




module.exports = { 
  loginLoad,
  verifyLogin,
  loadUser,
  restrict,
  loadCategory,
  addCategory,
  loadEditCategory,
  editCategory,
  loadUpdateCategory,
  updateCategory,
  loadAddProduct,
  addProduct,
  allProducts,
  editProducts,
  loadUpdateProduct,
  updateProduct,
  deleteimage,
  loadSubcategories, 
  logout,

};

