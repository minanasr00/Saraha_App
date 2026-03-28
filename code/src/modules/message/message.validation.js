import joi from "joi";
import { generalValidationFields } from "../../common/utils/validation.js";
import { fileFieldValidation } from "../../common/index.js";

export const sendMessageShcema = {
    params: joi.object({
        receiverId : generalValidationFields.id.required()
    }).required(),
    body: joi.object({
        content : joi.string().min(2).max(10000)
    }),
    files : joi.array().items(generalValidationFields.file(fileFieldValidation.images)).min(0).max(3)
}

export const getMessageShcema = {
    params: joi.object({
        messageId:joi.string().required()
    }).required()
}