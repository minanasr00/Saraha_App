import mongoose from "mongoose";
import { throwError, hashPassword, comparePassword, createLoginTokens, sendemail, emailTemplate, verifyOtb, ProviderEnum, resendOtp, emailEvent } from "../../common/index.js";
import { compareOtb, hashOtb } from "../../common/security/hash.security.js";
import { findOne,create, updateOne } from "../../db/index.js";
import { UserModel } from "../../db/index.js";
import { LogoutEnum } from "../../common/enums/logout.enums.js";
import { allKeysByPrefix, baseOtpKey, blockOtpKey, deleteKey, expire, get, incr, maxAttemptOtpKey, revokeTokenKey, revokeTokenKeyPrefix, set, ttl } from './../../common/services/redis.service.js';
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "../../../config/config.service.js";
import { generateOtp } from "../../common/security/otp.js";



export const signup = async (inputs) => {
  // Check if user already exists using repository
  const checkUserExist = await findOne(UserModel, { email: inputs.email });
  if (checkUserExist) {
    throwError("email already exist", 409);
  }
  // Hash password before storing
  const hashedPassword = await hashPassword(inputs.password);
  inputs.password = hashedPassword;
  delete inputs.confirmPassword;
  // Create user using repository
  const user = await create(UserModel, inputs);
  // Send OTP email
  const otp = generateOtp();
  await set({
    key: baseOtpKey(inputs.email),
    value: await hashOtb(otp),
    ttl: 300 // 5 minutes
  });
  emailEvent.emit("sendEmail",async () => {
    await sendemail({
    to: inputs.email,
    subject: "Welcome to Sraha App - Verify Your Email",
    html: emailTemplate(otp , `Confirm Your Email `)
    });
    await set({
      key: maxAttemptOtpKey(inputs.email),
      value: 1,
      ttl: 360 // 6 minutes
   });
  })

  return user;
};


export const sendOtb = async (email) => {
  const account =await findOne(UserModel, { email, confirmEmail: { $exists: false }, provider: ProviderEnum.system })
        if (!account) {
          throw throwError("Email Not Found or Already Confirmed")
        }
  
  const result = await resendOtp(email,"confirmEmail")
}

export const login = async (inputs , issuer) => {
  // Check if user exists using repository
  const user = await findOne(UserModel, { email: inputs.email , confirmEmail:{$exists:true}});
  if (!user) {
    throwError("Invalid Email or Password or not Confirmed Email", 404);
  }
  
  // Verify password
  const isPasswordValid = await comparePassword(inputs.password, user.password);
  if (!isPasswordValid) {
    throwError("Invalid email or password", 401);
  }
// Generate access and refresh tokens
  const { accessToken, refreshToken } = await createLoginTokens(user, issuer);
  // Return tokens
  return {  accessToken, refreshToken };
};

export const profile = async (user) => { 
  
  return user;
}

export const rotateTokens = async (user,{jti , iat , sub} ,  issuer) => {
if ((iat + Number(ACCESS_TOKEN_EXPIRES_IN)) * 1000 >= Date.now() + (30000)) {
  throw throwError("Access token not expired yet", 400);
}
  await set({
    key: revokeTokenKey(user.id, jti),
    value: jti,
    ttl: iat + Number(REFRESH_TOKEN_EXPIRES_IN)
  })
  const { accessToken, refreshToken } = await createLoginTokens(user, issuer);
  return { accessToken, refreshToken };
}


export const verifingEmailOtb = async (otp, email) => { 
  const emailEsxits = await findOne( 
    UserModel,
    { email, confirmEmail: { $exists: false }, provider: ProviderEnum.system }
  );

  if (!emailEsxits)
  {
    throw throwError("Email not found or already confirmed", 404); 
  }
  await verifyOtb(otp, email, "confirmEmail");
  const updateUser = await updateOne(UserModel, { email }, { confirmEmail: new Date() });    
  if (!updateUser) {      
    throw throwError("Failed to confirm email", 500);      
  }
  return true;
}

export const SharedProfile= async (id) => { 
  const user = await findOne(UserModel, { _id: id }, { projection: "-password -phone" });
  if (!user) {
    throwError("User not found", 404);
  }
  return user;
}

export const ProfileLogout = async (flag, user, { jti, iat , sub }) => { 
  let status = 200;
  switch (flag) {
    case LogoutEnum.all:
      user.chageCredentialTime = new Date();
      await user.save()
      const keys = await allKeysByPrefix(revokeTokenKeyPrefix(user._id))
      let deleted = await deleteKey(keys);
      return status;
    case LogoutEnum.only:
      const data = await set({
        key: revokeTokenKey(user.id,jti),
        value: jti,
        ttl: iat + Number(REFRESH_TOKEN_EXPIRES_IN)
      });
      
       status = 201;
      return { data, status };
    default:
      throw throwError("Invalid logout flag", 400);
  }
}

export const ProfilePicture = async (user, file) => { 
  user.profilePicture = file;
  await user.save();
  return user;
}

export const coverPicture = async (user, files) => { 
  console.log(files);
  
  user.coverProfilePictures = [ ...(user.coverProfilePictures || []), ...files.map(file => file.finalPath) ];
  await user.save();
  return user;
}

export const requestForgotPassword = async (email) => {
  const account = await findOne(UserModel, { email, confirmEmail: { $exists: true }, provider: ProviderEnum.system })
  if (!account) {
    throw throwError("Email not Found or not Confirmed",404)
  }
  await resendOtp(email, "forgotPassword")
  return true
}

export const varifyForgetPassword = async ({ otp, email }) => {
  const record = await get({ key: baseOtpKey(email,"forgotPassword") });

  if (!record) {
    throw throwError("No OTP record found for this email", 404);
  }
  const isValidOtp = await compareOtb(otp, record);
  if (!isValidOtp) {
    throw throwError("Invalid OTP", 400);
  }
  return "otp Varified Successfully"
}

export const resetForgotPassword = async ({email,password,otp},issuer) => {
  const user = await findOne(UserModel, { email, confirmEmail: { $exists: true }, provider: ProviderEnum.system })
  if (!user) {
    throw throwError("account not found or not Confirmed", 404);
  }
  await verifyOtb(otp, email, "forgotPassword")
  user.password = await hashPassword(password)
  user.chageCredentialTime = new Date()
  await user.save()
  await deleteKey(await allKeysByPrefix(revokeTokenKeyPrefix(user._id)))
  const { accessToken, refreshToken } = await createLoginTokens(user, issuer)
  return {accessToken , refreshToken}
}

export const updatePassword = async (user, { oldPassword, newPassword }) => {
  const confirmPassword = await comparePassword(oldPassword, user.password)

  if (!confirmPassword) {
    throw throwError("Old Password Doesn't Match", 404)
  }

  for (const hash of user.oldPasswords || []) {
    const match = await comparePassword(newPassword, hash)
    if (match) {
      throw throwError("password used before")
    }
  }

  user.oldPasswords.push(user.password)
  user.password = await hashPassword(newPassword)
  user.chageCredentialTime = new Date()
  await user.save()
  await deleteKey(await allKeysByPrefix(revokeTokenKey(user._id)))
  const {accessToken , refreshToken } = await createLoginTokens(user)
  return {accessToken , refreshToken} 
}