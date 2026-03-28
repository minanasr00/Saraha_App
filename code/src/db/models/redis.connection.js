import { createClient } from "redis";
import { REDIS_URI } from './../../../config/config.service.js';


export const redisClient = createClient({
  url: REDIS_URI,
});

export const redisConnect = async () => {
    try {
        redisClient.connect()
        console.log("redis connected 👌");
        
    } catch (error) {
        console.error("Error connecting to redis:", error);
    }
 };