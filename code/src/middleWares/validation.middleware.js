import { throwError } from "./../common/utils/throwError.utils.js";

export const validateRequest = (schema) => {
    return (req, res, next) => {
        let errors = [];  
        for (const key of Object.keys(schema) || []) {
            const { error } = schema[key].validate(req[key], { abortEarly: false });
            if (error) {
                errors.push(...error.details.map((detail) => detail.message));
            }
        }
        if (errors.length > 0) {
            throw throwError(errors.join(", "), 400);
        }
        next();
    }
}