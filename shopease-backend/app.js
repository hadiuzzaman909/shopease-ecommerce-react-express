const express=require("express");
const ErrorHandler = require("./utils/ErrorHandler");
const app=express();
const cookieParser=require("cookie-parser");
// const fileUpload=require("express-fileupload");
const cors=require("cors");

app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use("/",express.static("uploads"));
app.use(express.urlencoded({ extended: true }));
// app.use(fileUpload({useTempFiles: true}));


//import routes
const user=require("./controllers/userController");
app.use("/api/v1", user);





//config
if(process.env.NODE_ENV !== "PRODUCTION"){
    require("dotenv").config({
        path:"config/.env"
    })
}
//errorHandling
app.use(ErrorHandler)


module.exports=app;