const globalErrorHandler=require("./globalErrorHandler");
const asyncErrorHandler=require("./asyncErrorHandler");
const jwt=require("jsonwebtoken"); 


exports.isAuthenticated = asyncErrorHandler(async(req,res,next) => {

    const token = req.cookies;
    console.log("token is",token);
    
    if(!token){
        return next(new  globalErrorHandler("Please login to continue", 401));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);

    next();
});




exports.isAdmin = (...roles) => {
    return (req,res,next) => {
        if(!roles.includes(req.user.role)){
            return next(new  globalErrorHandler(`${req.user.role} can not access this resources!`))
        };
        next();
    }
}


