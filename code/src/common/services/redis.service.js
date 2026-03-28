
import { updateOne } from '../../db/database.repository.js';
import { UserModel } from '../../db/index.js';
import { redisClient } from '../../db/models/redis.connection.js';


export const revokeTokenKey = (userId, jti) => {
    return `user:RevokeToken:${userId}:${jti}`;
}

export const revokeTokenKeyPrefix = (userId) => {
    return `user:RevokeToken:${userId}`;
}

export const baseOtpKey = (email ,subject= "confirmEmail") => {
    return `otp::user::${email}::${subject}`;
}
export const maxAttemptOtpKey = (email ,subject= "confirmEmail") => {
    return `${baseOtpKey(email,subject)}::maxTrial`;
}
export const blockOtpKey = (email ,subject= "confirmEmail") => {
    return `${baseOtpKey(email,subject)}::blockOtp`;
}


export const set = async ({ key, value, ttl = null }={}) => {
    try {
        const data =typeof value === "string" ? value : JSON.stringify(value);

        if (ttl) {  
            // ttl by seconds
            await redisClient.setEx(key, ttl, data);
        } else {
            await redisClient.set(key, data);
        }

        return true;
    } catch (error) {
        console.error("Redis SET error:", error);
        return false;
    }
}

export const get = async ({ key }={}) => {
    try {
        const data = await redisClient.get(key);
        if (!data) return null;

        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    } catch (error) {
        console.error("Redis GET error:", error);
        return null;
    }
}


export const update = async (key, value, ttl = null) => {
    try {
        const exists = await redisClient.exists(key);
        if (!exists) return false;
        return await redisClient.set(key, value, ttl);
    } catch (error) {
        console.error("Redis UPDATE error:", error);
        return false;
    }
}

export const deleteKey = async (key) => {
    try {
        const result = await redisClient.del(key);
        return result;
    } catch (error) {
        console.error("Redis DELETE error:", error);
        return false;
    }
}


export const expire = async (key, ttl) => {
    try {
        const result = await redisClient.expire(key, ttl);
        return result ;
    } catch (error) {
        console.error("Redis EXPIRE error:", error);
        return false;
    }
}
export const incr = async (key) => {
    try {
        const result = await redisClient.incr(key);
        return result 
    } catch (error) {
        console.error("Redis incr error:", error);
        return false;
    }
}


export const ttl = async (key) => {
    try {
        return await redisClient.ttl(key);
    } catch (error) {
        console.error("Redis TTL error:", error);
        return -2;
    }
}


export const allKeysByPrefix = async (baseKey) => {
    return await redisClient.keys(`${baseKey}*`);
}



export const logout = async (inputs) => {
    const { flag, decoded, FCMToken } = inputs;
    let status = 200;
    switch (flag) {
        case LogoutEnum.All:
            await updateOne({
                model: UserModel,
                filter: { _id: decoded?._id },
                update: {
                    changeCredentialsTime: new Date(),
                },
            });


            await Promise.allSettled([removeUser(decoded?._id),
            removeFCMUser(decoded?._id),
            deleteKey(await allKeysByPrefix(revokeTokenKeyPrefix(`${decoded?._id}*`)))])

            break;
        default:
            await createRevokeToken(decoded);
            if (FCMToken) {
                await removeFCM(decoded._id, FCMToken)
            }
            status = 201;
            break;
    }
    return status;
};


export const createNumberOtp = () => {
  return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
};