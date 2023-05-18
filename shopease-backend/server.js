const app=require("./app");


//create server
const server=app.listen(process.env.PORT,()=>{
    console.log(`Sever is running on http://localhost:${process.env.PORT}`)
})


//handling uncaught Exception
process.on("uncaughtException",(err)=>{
    console.log(`Error: ${err.message}`);
    console.log(`shutting down the server for handling uncaught exception`);
})


//unhandled promise rejection
process.on("unhandledRejection",(err)=>{
    console.log(`Shutting down the server for ${err.message}`);
    console.log(`shutting down the server for unhandled promise rejection`);
    server.close(()=>{
        process.exit(1);
    })

})