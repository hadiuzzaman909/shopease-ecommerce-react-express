const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const globalErrorHandler = require("../middlewares/globalErrorHandler");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/jwtToken");


//special
const { upload } = require("../multer");
const path = require("path");
const fs = require("fs");
const { isAuthenticated } = require("../middlewares/auth");


//create-user
router.post("/user/create-user", upload.single("file"), async (req, res, next) => {
    const { name, email, password } = req.body;
    console.log(req.body);
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
    const activationUrl = `http://localhost:3000/activation/${activationToken}`;

    try {
        await sendMail({
            email: user.email,
            subject: "Activate your account",
            message: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`,
        })
        res.status(201).json({
            success: true,
            message: `please check your email:- ${user.email} to activate your account`
        })
    }
    catch (error) {
        return next(new globalErrorHandler(error.message, 500))
    }
});


//create activation token
const createActivationToken = (user) => {
    return jwt.sign(user, process.env.ACTIVATION_SECRET, {
        expiresIn: "5m",
    })
}

//activate user
router.post("/user/activation", (async (req, res, next) => {
    try {
        const { activation_token } = req.body;
        const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
        if (!newUser) {
            console.log("new1")
            return next(new globalErrorHandler("invalid token", 400))
        }
        const { name, email, password, avatar } = newUser;
        let user = await User.findOne({ email });
        if (user) {
            console.log("new2")
            return next(new globalErrorHandler("User already exist", 400))
        }
        user = await User.create({ name, email, avatar, password });
        console.log("user info:", user);
        sendToken(user, 201, res);
    }
    catch (error) {
        console.log("new3");
        console.log(error);
        return next(new globalErrorHandler(error.message, 500))
    }
}))


//login-user
router.post("/user/login", asyncErrorHandler(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log("login",req.body);
        if (!email || !password) {
            return next(new globalErrorHandler("Please provide the all fields!", 400));
        }
        const user=await User.findOne({email}).select("+password");
        console.log("userInfo",user);
        if(!user){
            return next(new globalErrorHandler("User doesn't exist !",400));
        }
        const isPasswordValid = await user.comparePassword(password);
        console.log(isPasswordValid);
        if (!isPasswordValid) {
          return next(
            new  globalErrorHandler("Please provide the correct information", 400)
          );
        }
        sendToken(user, 201, res);
    }
    catch (error) {
        return next(new globalErrorHandler(error.message, 500));
    }
}))

// load user
router.get("/user/getUser",isAuthenticated, asyncErrorHandler(async (req, res, next) => {
      try {
        const user = await User.findById(req.user.id);
        if (!user) {
          return next(new globalErrorHandler("User doesn't exists", 400));
        }
  
        res.status(200).json({
          success: true,
          user,
        });
      } catch (error) {
        console.log("ffffffff")
        return next(new globalErrorHandler(error.message, 500));
      }
    })
  );


// update user password
router.put(
    "/update-user-password",
    isAuthenticated,
    asyncErrorHandler(async (req, res, next) => {
      try {
        const user = await User.findById(req.user.id).select("+password");
  
        const isPasswordMatched = await user.comparePassword(
          req.body.oldPassword
        );
  
        if (!isPasswordMatched) {
          return next(new globalErrorHandler("Old password is incorrect!", 400));
        }
  
        if (req.body.newPassword !== req.body.confirmPassword) {
          return next(
            new globalErrorHandler("Password doesn't matched with each other!", 400)
          );
        }
        user.password = req.body.newPassword;
  
        await user.save();
  
        res.status(200).json({
          success: true,
          message: "Password updated successfully!",
        });
      } catch (error) {
        return next(new globalErrorHandler(error.message, 500));
      }
    })
  );

  
  // log out user
  router.get(
    "/logout",
    asyncErrorHandler(async (req, res, next) => {
      try {
        res.cookie("token", null, {
          expires: new Date(Date.now()),
          httpOnly: true,
        });
        res.status(201).json({
          success: true,
          message: "Log out successful!",
        });
      } catch (error) {
        return next(new globalErrorHandler(error.message, 500));
      }
    })
  );

module.exports = router; 