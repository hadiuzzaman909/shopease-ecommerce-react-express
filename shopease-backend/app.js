const express=require("express");
const ErrorHandler = require("./utils/ErrorHandler");
const app=express();
const cookieParser=require("cookie-parser");
const fileUpload=require("express-fileupload");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({useTempFiles: true}));


//config
if(process.env.NODE_ENV !== "PRODUCTION"){
    require("dotenv").config({
        path:"config/.env"
    })
}
 
//errorHandling
app.use(ErrorHandler)


module.exports=app;