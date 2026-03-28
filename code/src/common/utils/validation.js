import joi from "joi";
import { ProviderEnum } from "../enums/provider.enums.js";
import { RoleEnum } from "../enums/role.enums.js";
import { Types } from "mongoose";

export const generalValidationFields = {
    otp: joi.string().pattern(new RegExp(/^\d{6}$/)),
    userName: joi.string().min(3).max(30),
    email: joi.string().email({ tlds: { allow: ['com', 'net', 'org'] } }).lowercase(),
    password: joi.string().min(8).max(30),
    confirmPassword: function (path = "password") {
        return joi.string().valid(joi.ref(path)).messages({ 'any.only': `confirmPassword must match ${path}` });
    },
        phone: joi.string().pattern(/^(\+20|20|0)?1(0|1|2|5)\d{8}$/),
        gender: joi.string().valid('male', 'female').insensitive().lowercase(),
        role: joi.string().valid(RoleEnum.admin, RoleEnum.user).insensitive().lowercase(),
    provider: joi.number().valid(ProviderEnum.system, ProviderEnum.google),
    id: joi.string().custom((value, helpers) => {
        return Types.ObjectId.isValid(value) ? value : helpers.message("invalid object id");
    }),
    file: function (validation=[]) {
        return joi.object({
            "fieldname": joi.string().required(),
            "originalname": joi.string().required(),
            "encoding": joi.string().required(),
            "mimetype": joi.string().valid(...Object.values(validation)).required(),
            "finalPath": joi.string().required(),
            "destination": joi.string().required(),
            "filename": joi.string().required(),
            "path": joi.string().required(),
            "size": joi.number().required()
        })
    }
}