import bcrypt from "bcrypt";
import { SALT_ROUND } from './../../../config/config.service.js';


export const hashPassword = async (password) => {
    return await bcrypt.hash(password, Number(SALT_ROUND));
};

export const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

export const hashOtb = async (otb) => { 
    return await bcrypt.hash(otb, Number(SALT_ROUND));
}

export const compareOtb = async (otb, hashedOtb) => {
    return await bcrypt.compare(otb, hashedOtb);
}