const productModel = require('../models/productModel')
const wishListModel = require('../models/wishListModel')
const cartModal = require('../models/cartModal')
const categoryModal = require('../models/categoryModel')
const path = require("path")
const offerModel  = require("../models/offer")
const sharp = require("sharp")

const loadProductList = async (req, res) => {
    try {
        const userId = req.session.user_id
        const isLoggedIn = !!req.session.user_id
        const page = parseInt(req.query.page) || 1 // Current page number
        const limit = 6
        const path = req.path
        const filter = {
            list: true,
        }

        filter.subcategory_id = {
            $in: await categoryModal.find({
                isBlock: false,
            }),
        }
        const { category, brand: manufacturer, sort, search } = req.query

        // If brand filter is applied
        if (manufacturer && Array.isArray(manufacturer)) {
            filter.manufacturer = { $in: manufacturer }
        } else if (manufacturer) {
            filter.manufacturer = manufacturer
        }

        if (category && Array.isArray(category)) {
            filter.subcategory_id = {
                $in: await categoryModal.find({
                    subcategory: category,
                }),
            }
        } else if (category) {
            filter.subcategory_id = await categoryModal.find({
                subcategory: category,
            })
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } }, // Case-insensitive search
                { manufacturer: { $regex: search, $options: 'i' } },
            ]
        }

        const sortOptions = {}
        if (req.query.sortBy === '-1') {
            sortOptions['price'] = -1
        } else if (req.query.sortBy === '1') {
            sortOptions['price'] = 1
        }

        const productsCount = await productModel.find(filter).countDocuments()
        const totalPages = Math.ceil(productsCount / limit)

        const startIndex = (page - 1) * limit

        const products = await productModel
            .find(filter)
            .populate({
                path: 'subcategory_id',
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limit)

        const subcategory = await categoryModal.distinct('subcategory')
        const brand = await productModel.distinct('manufacturer')

        const wishList = await wishListModel.findOne({ userId })
        const cart = await cartModal.findOne({ userId })

        res.render('productGrid', {
            find: products,
            category: 'All products',
            brand,
            cart,
            subcategory,
            isLoggedIn,
            wishList,
            cat: 'all',
            path,
            currentPage: page,
            totalPages,
        })
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
}

//=========================================Load Men products on ===============================
const loadMen = async (req, res) => {
    try {
        const userId = req.session.user_id
        const isLoggedIn = req.session.user_id ? true : false
        const { category, brand: manufacturer, sort, search } = req.query
        const page = parseInt(req.query.page) || 1 // Current page number
        const limit = 6
        const query = {
            list: true,
        }
        query.subcategory_id = {
            $in: await categoryModal.find({
                isBlock: false,
            }),
        }

        if (manufacturer && Array.isArray(manufacturer)) {
            query.manufacturer = { $in: manufacturer }
        } else if (manufacturer) {
            query.manufacturer = manufacturer
        }

        if (category && Array.isArray(category)) {
            query.subcategory_id = {
                $in: await categoryModal.find({
                    subcategory: category,
                }),
            }
        } else if (category) {
            query.subcategory_id = await categoryModal.find({
                subcategory: category,
            })
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } }, // Case-insensitive search
                { manufacturer: { $regex: search, $options: 'i' } },
            ]
        }

        const path = req.path
        const startIndex = (page - 1) * limit
        const find = await productModel
            .find(query)
            .populate({
                path: 'subcategory_id',
                match: { name: 'Men' },
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')

        const filteredFind = find.filter((item) => item.subcategory_id !== null)
        const productsCount = filteredFind.length
        const totalPages = Math.ceil(productsCount / limit)

        const paginatedResults = filteredFind.slice(
            startIndex,
            startIndex + limit
        )

        const brand = await productModel.distinct('manufacturer')
        const subcategory = await categoryModal.distinct('subcategory')
        const wishList = await wishListModel.findOne({ userId: userId })
        const cart = await cartModal.findOne({ userId: userId })

        res.render('productGrid', {
            find: paginatedResults,
            path,
            currentPage: page,
            cart,
            totalPages,
            category: "Men's shoes",
            brand,
            subcategory,
            isLoggedIn,
            wishList,
            cat: 'Men',
        })
    } catch (error) {
        console.error(error)
    }
}

//=========================================Load women productspage===============================

const loadWomen = async (req, res) => {
    try {
        const userId = req.session.user_id
        const isLoggedIn = req.session.user_id ? true : false
        const { category, brand: manufacturer, sortBy, search } = req.query
        const page = parseInt(req.query.page) || 1 // Current page number
        const limit = 6

        const query = {
            list: true,
        }
        query.subcategory_id = {
            $in: await categoryModal.find({
                isBlock: false,
            }),
        }
        if (manufacturer && Array.isArray(manufacturer)) {
            query.manufacturer = { $in: manufacturer }
        } else if (manufacturer) {
            query.manufacturer = manufacturer
        }

        if (category && Array.isArray(category)) {
            query.subcategory_id = {
                $in: await categoryModal.find({
                    subcategory: category,
                }),
            }
        } else if (category) {
            query.subcategory_id = await categoryModal.find({
                subcategory: category,
            })
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } }, // Case-insensitive search
                { manufacturer: { $regex: search, $options: 'i' } },
            ]
        }

        const sortOptions = {}
        if (req.query.sortBy === '-1') {
            sortOptions['price'] = -1
        } else if (req.query.sortBy === '1') {
            sortOptions['price'] = 1
        }

        const path = req.path
        const startIndex = (page - 1) * limit
        const find = await productModel
            .find(query)
            .populate({
                path: 'subcategory_id',
                match: { name: 'Women' },
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')
            .sort(sortOptions)
        const filteredFind = find.filter(
            (item) => item.subcategory_id && item.subcategory_id.name == 'Women'
        )
        const productsCount = filteredFind.length
        const totalPages = Math.ceil(productsCount / limit)
        const paginatedResults = filteredFind.slice(
            startIndex,
            startIndex + limit
        )

        const brand = await productModel.distinct('manufacturer')
        const subcategory = await categoryModal.distinct('subcategory')
        const wishList = await wishListModel.findOne({ userId: userId })
        const cart = await cartModal.findOne({ userId: userId })

        res.render('productGrid', {
            find: paginatedResults,
            currentPage: page,
            cart,
            path,
            totalPages,
            category: "Women's shoes",
            brand,
            subcategory,
            isLoggedIn,
            wishList,
            cat: 'Women',
        })
    } catch (error) {
        console.error(error)
    }
}

//=========================================Load Kids products ===============================

const loadKids = async (req, res) => {
    try {
        const userId = req.session.user_id
        const isLoggedIn = req.session.user_id ? true : false
        const { category, brand: manufacturer, sort, search } = req.query

        const page = parseInt(req.query.page) || 1 // Current page number
        const limit = 6

        const query = {
            list: true,
        }
        query.subcategory_id = {
            $in: await categoryModal.find({
                isBlock: false,
            }),
        }

        if (manufacturer && Array.isArray(manufacturer)) {
            query.manufacturer = { $in: manufacturer }
        } else if (manufacturer) {
            query.manufacturer = manufacturer
        }

        if (category && Array.isArray(category)) {
            query.subcategory_id = {
                $in: await categoryModal.find({
                    subcategory: category,
                }),
            }
        } else if (category) {
            query.subcategory_id = await categoryModal.find({
                subcategory: category,
            })
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } }, // Case-insensitive search
                { manufacturer: { $regex: search, $options: 'i' } },
            ]
        }

        const sortOptions = {}
        if (req.query.sortBy === '-1') {
            sortOptions['price'] = -1
        } else if (req.query.sortBy === '1') {
            sortOptions['price'] = 1
        }

        // const totalPages = Math.ceil(productsCount / limit)
        const path = req.path
        const startIndex = (page - 1) * limit

        const find = await productModel
            .find(query)
            .populate({
                path: 'subcategory_id',
                match: { name: 'Kids' },
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')
            .sort(sortOptions)

        const filteredFind = find.filter((item) => item.subcategory_id !== null)
        const productsCount = filteredFind.length
        const totalPages = Math.ceil(productsCount / limit)
        const paginatedResults = filteredFind.slice(
            startIndex,
            startIndex + limit
        )
        const brand = await productModel.distinct('manufacturer')
        const subcategory = await categoryModal.distinct('subcategory')
        const wishList = await wishListModel.findOne({ userId: userId })
        const cart = await cartModal.findOne({ userId: userId })

        res.render('productGrid', {
            find: paginatedResults,
            currentPage: page,
            totalPages,
            path,
            cart,
            category: 'Kids shoes',
            brand,
            subcategory,
            isLoggedIn,
            wishList,
            cat: 'Kids',
        })
    } catch (error) {
        console.error(error)
    }
}

//===================================Load product details page==========================================

const loadProductDetails = async (req, res) => {
    try {
        const userId = req.session.user_id
        const find = await productModel
            .findOne({ _id: req.query.id })
            .populate({
                path: 'subcategory_id',
                match: { name: 'Kids' },
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')
        const wishList = await wishListModel.findOne({ userId: userId })
        res.render('productDetails', { find, wishList })
    } catch (error) {
        console.error(error)
    }
}



//---------------------------  admin side -------



const loadAddProduct = async (req,res)=>{
    try{
        const find = await categoryModal.distinct("subcategory")
        res.render("addProduct",{find})
    }catch(error){
        console.error(error);
    }
  
}

const loadSubcategories = async (req,res)=>{
    try{
        const {mainCategory} = req.query
        const subcategory = await categoryModal.distinct("subcategory",{name:mainCategory})
      
        res.status(200).json({ message: "Subcategories loaded successfully",subcategory});
    }catch(error){
        console.error(error);
    }
 
}

//========================================Add product with image=============================
const addProduct = async (req,res)=>{

    try{
      const {name,manufacturer,price,description,subcategory,maincategory,quantity} = req.body
      const  find  = await categoryModal.findOne({name:maincategory,subcategory:subcategory})
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

        const productCollection = new productModel({
            name: name,
            manufacturer: manufacturer,
            price: price,
            description: description,
            subcategory_id: subcategory_id,
            quantity: quantity,
            product_image: productImages,
        })
        
       
      const save =await productCollection.save() 

    }catch(error){
      console.log(error); 
    }
    const find = await categoryModal.distinct("subcategory")
     res.render("addProduct",{find})
}

const allProducts = async (req, res) => {
  try {
    const ITEMS_PER_PAGE = 8; 
    const page = parseInt(req.query.page) || 1;
    const totalProductsCount = await productModel.countDocuments();
    const totalPages = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const find = await productModel
      .find({})
      .populate("subcategory_id")
      .populate("offer")
      .skip(skip)
      .limit(ITEMS_PER_PAGE);

    const offer = await offerModel.find({});

    res.render("allProducts", { find, offer, totalPages, currentPage: page });
  } catch (error) {
    console.log(error);
  }
};

const editProducts = async (req,res)=>{

  try{
     const id = req.query.id 
     const {action} = req.body
    if(action == "list"){
     
      const find = await productModel.findOne({_id:id})
      if(find.list==true){
         await productModel.updateOne({_id:id},{$set:{list:false}})
         res.redirect("/admin/all-products")
      }else {
         await productModel.updateOne({_id:id},{$set:{list:true}})
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
      const subcategory = await categoryModal.distinct("subcategory")
      const find = await productModel.findOne({_id:id}).populate("subcategory_id")
      res.render("updateProducts",{find,subcategory})
  }catch(error){
      console.log(error);
  }
}

const updateProduct = async(req,res)=>{
 
    try {

    const { id } = req.query;
    const { name, manufacturer, price, description, maincategory, subcategory,quantity } = req.body;

    const find= await categoryModal.findOne({name:maincategory,subcategory:subcategory})
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
      const result = await productModel.updateOne({ _id: id }, { $set: updatedFields });
  
    }else{
      const subcategory1 = await categoryModal.distinct("subcategory")
      const find2 = await productModel.findOne({_id:id}).populate("subcategory_id")
      res.render("updateProducts",{find:find2,subcategory:subcategory1})
    }
    
      const subcategory1 = await categoryModal.distinct("subcategory")
      const find2 = await productModel.findOne({_id:id}).populate("subcategory_id")
      res.render("updateProducts",{find:find2,subcategory:subcategory1})
  } catch (error) {
    console.log(error); 
    res.status(500).send("Internal Server Error");
  }
};

const deleteimage = async (req,res)=>{
    try{
        const {product_id,img_id} = req.query
        await productModel.updateOne(
        {_id:product_id},
        {
          $pull:{
            product_image:{
              _id:img_id
            }}
        })
        const find = await productModel.find({})
        res.redirect(`/admin/update-product?id=${product_id}`)
    }catch(error){
        console.error(error);
    }
  

}





module.exports = {
    loadProductList,
    loadMen,
    loadWomen,
    loadKids,
    loadWomen,
    loadProductDetails,
    loadAddProduct,
    loadSubcategories,
    addProduct,
    allProducts,
    editProducts,
    loadUpdateProduct,
    updateProduct,
    deleteimage

}