const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const globalErrorHandler = require("../middlewares/globalErrorHandler");
const asyncErrorHandler=require("../middlewares/asyncErrorHandler");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const sendToken=require("../utils/jwtToken");
//special
const { upload } = require("../multer");
const path = require("path");
const fs = require("fs");


//create-user
router.post("/user/create-user", upload.single("file"), async (req, res, next) => {
    const { name, email, password } = req.body;
    const userEmail = await User.findOne({ email });

    if (userEmail) {
        const filename = req.file.filename;
        const filePath = `uploads/${filename}`;
        fs.unlink(filePath, (err) => {
            if (err) {
                console.log(err);
                res.status(500).json({ message: "Error deletion file" });
            }
        })
        return next(new globalErrorHandler("User already exist", 400));
    }

    const filename = req.file.filename;
    const fileUrl = path.join(filename);
    const user = {
        name: name,
        email: email,
        password: password,
        avatar: fileUrl
    }
    const activationToken = createActivationToken(user);
    const activationUrl=`http://localhost:3000/activation/${activationToken}`;

    try{
        await sendMail({
            email:user.email,
            subject:"Activate your account",
            message: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`,
        })
        res.status(201).json({
            success:true,
            message: `please check your email:- ${user.email} to activate your account` 
        })
    }
    catch(error){
        return next(new globalErrorHandler(error.message,500))
     }
});


//create activation token
const createActivationToken = (user) => {
    return jwt.sign(user, process.env.ACTIVATION_SECRET, {
        expiresIn: "5m",
    })
}

//activate user
router.post("/user/activation", asyncErrorHandler(async(req,res,next)=>{
    try{
        const {activation_token}=req.body;
        const newUser=jwt.verify(activation_token,process.env.ACTIVATION_SECRET);
        if(!newUser){
            return next(new globalErrorHandler("invalid token",400))
        }
        const {name,email,password,avatar}=newUser;
        let user=await User.findOne({email});
        if(user){
            return next(new globalErrorHandler("User already exist",400))
        }
        user=await User.create({name,email,avatar,password});
        console.log("user info:",user);
        sendToken(user,201,res);
    }
    catch(error){
        return next(new globalErrorHandler(error.message,500))
    }
}))



module.exports = router; 