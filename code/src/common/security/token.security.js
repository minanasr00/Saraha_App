import jwt from 'jsonwebtoken';
import { RoleEnum } from '../enums/role.enums.js';
import { throwError } from '../utils/throwError.utils.js';
import { TokenTypeEnum } from '../enums/tokenType.enums.js';
import { findOne } from '../../db/database.repository.js';
import { UserModel } from '../../db/index.js';
import { errorResponse } from '../reponse/error.response.js';
import { randomUUID } from 'node:crypto';
import { get, revokeTokenKey } from '../services/redis.service.js';
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from '../../../config/config.service.js';

//generate access and refresh tokens

export const createLoginTokens = async (user, issuer) => {
    const jwtid = randomUUID();
    const accessPayload = { sub: user._id, aud: [TokenTypeEnum.ACCESS, user.role], iss: issuer, jti:jwtid }
    const refreshPayload = { sub: user._id, aud: [TokenTypeEnum.REFRESH, user.role], iss: issuer, jti:jwtid }
    const { accessSignature, refreshSignature } = await getTokenSignature(user.role)
    const accessToken = await generateAccessToken({ payload: accessPayload, secret: accessSignature, options: { expiresIn: Number(ACCESS_TOKEN_EXPIRES_IN) } });
    const refreshToken = await generateRefreshToken({ payload: refreshPayload, secret: refreshSignature, options: { expiresIn: Number(REFRESH_TOKEN_EXPIRES_IN) } });
    return { accessToken, refreshToken };
}
export const generateAccessToken = async ({ payload, secret, options } = {}) => {
    return  jwt.sign(payload, secret, options);
}
export const generateRefreshToken = async ({ payload, secret, options } = {}) => {
    return jwt.sign(payload, secret, options);
}

// Function to get token signature based on role and token type
export const getTokenSignature =async (role) => { 
    let refreshSignature
    let accessSignature     
    switch (role) {
        case RoleEnum.admin:
            accessSignature = process.env.ADMIN_ACCESS_TOKEN_SECRET
            refreshSignature = process.env.ADMIN_REFRESH_TOKEN_SECRET
            return { accessSignature, refreshSignature }
        case RoleEnum.user:
            accessSignature = process.env.USER_ACCESS_TOKEN_SECRET
            refreshSignature = process.env.USER_REFRESH_TOKEN_SECRET
            return { accessSignature, refreshSignature }
        default:
            throw throwError("Invalid role", 400);
    }
}

// Function to verify token
export const verifyToken = async ({ token, secret } = {}) => { 
    try {
        const verifed = jwt.verify(token, secret);
        return verifed;
    } catch (err) {
        throw throwError(err.message, 401);
    }
}

// Function to decode token and get user data
export const decodeToken = async (token, type = TokenTypeEnum.ACCESS) => { 
    
    const decoded = jwt.decode(token);


    if (!decoded || !decoded.aud) {
        throw throwError("Invalid token", 401);    
    }
    const [tokenType, tokenRole] = decoded.aud;
    // Check if token type is valid
    if (tokenType !== type) {
        throw throwError("Invalid token type", 401);
    }

    if (decoded.jti && await get({ key: revokeTokenKey(decoded.sub, decoded.jti) })) {
        return throwError("Token has been revoked", 401);
        
    }
    // Get the correct signature based on the role and token type
    const { accessSignature, refreshSignature } = await getTokenSignature(tokenRole == RoleEnum.user ? RoleEnum.user : RoleEnum.admin);
    const signature = tokenType === TokenTypeEnum.ACCESS ? accessSignature : refreshSignature
    const verifedData = await verifyToken({ token, secret: signature });    
    //check if user still exist
    const user = await findOne(UserModel, { _id: verifedData.sub });
    if (!user) {
        return errorResponse({status:401, message:"Not Registered Account"})
    }

    if (user.chageCredentialTime && user.chageCredentialTime >= decoded.iat * 1000) {
        throw throwError("Invalid Login Session", 401);
    }

    // Return user
    return { user, decoded };

}
