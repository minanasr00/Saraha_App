
import { decodeToken, errorResponse } from "../common/index.js";
import { TokenTypeEnum } from "../common/enums/tokenType.enums.js";

export const authentication = (tokenType=TokenTypeEnum.ACCESS) => {

    return async (req, res, next) => { 
        const authorization = req?.headers?.authorization;
        const token = authorization && authorization.split(" ")[0] === "Bearer" ? authorization.split(" ")[1] : null;
        if (!token) {
            return errorResponse({
                error: { message:"Authorization header is missing"},
                res,
                status: 401,
            });
        }
        const { user ,decoded} = await decodeToken(token, tokenType);
        
        req.user = user;
        req.decoded = decoded;
        next();
    };
 }