const express=require("express");
const path=require("path");
const router=express.Router();
const {upload}=require("../multer");
const ErrorHandler=require("../utils/ErrorHandler");
const User=require("../models/userModel");

router.post("/create-user",upload.single("file"),async(req,res,next)=>{
    const {name,email,password}=req.body;
    const userEmail=await User.findOne({email});

    if(userEmail){
        return next(new ErrorHandler("User already exist",400));
    }

    const filename=req.file.filename;
    const fileUrl=path.join(filename);

    const user={
        name:name,
        email:email,
        password:password,
        avatar:fileUrl,
    }

    console.log(user);
})


module.exports=router;