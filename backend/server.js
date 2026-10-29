require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const estimationsRouter = require("./routes/estimations");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({limit:"20kb"}));
app.use(rateLimit({windowMs:15*60*1000,limit:300,standardHeaders:"draft-7",legacyHeaders:false}));
app.use(express.static(path.join(__dirname,"..","frontend")));

app.get("/api/health",(_req,res)=>res.json({status:"ok",application:"BIOWISE AI"}));
app.use("/api/estimations",estimationsRouter);

app.use("/api",(req,res)=>res.status(404).json({error:"API route not found."}));
app.use((err,_req,res,_next)=>{
  // Log detailed errors on the server only; do not send database details to the browser.
  console.error("API error:",err.message || err);
  res.status(500).json({error:"A server or database error occurred. Check the backend terminal and Supabase configuration."});
});

app.listen(PORT,()=>console.log(`BIOWISE AI running at http://localhost:${PORT}`));
