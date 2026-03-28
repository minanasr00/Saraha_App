
import joi from 'joi';
import { generalValidationFields } from '../../common/utils/validation.js';
import { fileFieldValidation } from '../../common/index.js';



export const signupschema = {
   body : joi.object({
        userName: generalValidationFields.userName.required(),
        email: generalValidationFields.email.required(),
        password: generalValidationFields.password.required(),
        confirmPassword: generalValidationFields.confirmPassword("password").required(),
        phone: generalValidationFields.phone.required(),
        gender: generalValidationFields.gender.required(),
        role: generalValidationFields.role,
        provider: generalValidationFields.provider,
   }).required(),
    query: joi.object({
        lang: joi.string().valid('en', 'ar').insensitive().lowercase(),
    }),
}
export const loginschema = {
    body: joi.object({
        email: generalValidationFields.email.required(),
        password: generalValidationFields.password.required(),
    }).required()
    
}

export const shareProfileSchema = {
    params: joi.object({
        id: generalValidationFields.id.required(),
    })
}

export const ProfilePictureSchema = {
    file : generalValidationFields.file(fileFieldValidation.images).required()
}
export const CoverPictureSchema = {
    file : joi.array().items(generalValidationFields.file(fileFieldValidation.images)).min(1).max(3).required()
}

export const confirmEamilSchema={
    body: joi.object({
        email: generalValidationFields.email.required(),
        otp: generalValidationFields.otp.required()
     }).required()
}
export const resendConfirmEamilSchema={
    body: joi.object({
        email: generalValidationFields.email.required(),
        
     }).required()
}

export const resetForgotPasswordSchema = {
    body: confirmEamilSchema.body.append({
        password: generalValidationFields.password.required(),
        confirmPassword: generalValidationFields.confirmPassword("password").required()
    }).required()
    
}

export const updatePasswordSchema = {
    body: joi.object({
        oldPassword: generalValidationFields.password.required(),
        newPassword: generalValidationFields.password.required(),
        confirmPassword: generalValidationFields.confirmPassword("newPassword").required()
        
    }).required()
}