const express=require("express");
const app=express();
const cookieParser=require("cookie-parser");
const cors=require("cors");
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use("/",express.static("uploads"));
app.use(express.urlencoded({ extended: true }));


//import config
if(process.env.NODE_ENV !== "PRODUCTION"){
    require("dotenv").config({
        path:"config/.env"
    })
}

//database connection
const connectDatabase = require("./db/database");
connectDatabase();


//import routes
const user=require("./controllers/userController");
app.use("/api/v1", user);



//import error
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);



module.exports=app;