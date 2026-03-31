import express from "express";
import morgan from "morgan";
import cors from 'cors'
import { authenticateDB } from "./db/index.js";
import { errorResponse, wrongRouteResponse } from "./common/index.js";
import { messageRouter, userRouter } from "./modules/index.js";
import { port } from "../config/config.service.js";
import { redisClient, redisConnect } from "./db/models/redis.connection.js";
import path from 'node:path';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import  helmet  from 'helmet';
import rateLimit, { ipKeyGenerator } from "express-rate-limit"

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default async function bootstrap() {
  const app = express();
  app.set("trust proxy" , true)
  //static files
  app.use("/uploads", express.static(resolve("../uploads/")));
  app.use(express.static(resolve("../frontEnd/dist")));
  
  //DB connection
  await authenticateDB();
  await redisConnect();

  //middleWares
//   const limiter = rateLimit({
//     windowMs: 2 * 60 * 1000,
//     limit: 5,
//     requestPropertyName: "rateLimit",
//     legacyHeaders: false,
//     skipFailedRequests: true,
//     standardHeaders: "draft-8",
//     keyGenerator: (req, res, next)=>{
//       const ip = ipKeyGenerator(req.ip, 56)
//       console.log(`${ip}-${req.path}`);
//       return `${ip}-${req.path}`
//     },
//     store: {
//     async incr(key, cb) { // get called by keyGenerator
//       try {
//         const count = await redisClient.incr(key);
//         if (count === 1) await redisClient.expire(key, 120); // 2 min TTL
//         cb(null, count);
//       } catch (err) {
//         cb(err);
//       }
//     },
 
//     async decrement(key) {  // called by kipFailedRequests:true ,  skipSuccessfulRequests:true,
//       await redisClient.decr(key);
//     },
//   },
  
// })
  app.get("/", (req, res, next) => {
  res.json("hello world")
})
  
  if (process.env.NODE_ENV === "development") app.use(morgan("combined"));
  app.use(cors(),helmet(),express.json());

  //route handling
  app.use("/api/user", userRouter);
  app.use("/api/message",messageRouter)

  // SPA fallback
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../../frontEnd/dist/index.html'));
  });

  //route handling error
  app.use((req, res) => {
    wrongRouteResponse(res);
  });

  //error handling
  app.use((err, req, res, next) => {
    errorResponse({ error: err, res });
  });

  //create server
  app.listen(port, (error) => {
    if (error) return console.log("Server error ❌: ", error.message);
    console.log("Server running successfully on port 3000 🚀");
  });
}
