import nodemailer from 'nodemailer';
import { EMAIL_PASSWORD, EMAIL_SERVICE, EMAIL_USER } from '../../../../config/config.service.js';
import { allKeysByPrefix, baseOtpKey, blockOtpKey, deleteKey, expire, get, incr, maxAttemptOtpKey, set, ttl } from '../../services/redis.service.js';
import { throwError } from '../throwError.utils.js';
import { compareOtb, hashOtb } from '../../security/hash.security.js';
import { findOne, updateOne } from '../../../db/database.repository.js';
import { ProviderEnum } from '../../enums/provider.enums.js';
import { UserModel } from '../../../db/index.js';
import mongoose from 'mongoose';
import { generateOtp } from '../../security/otp.js';
import { emailTemplate } from './email.template.js';
import { emailEvent } from './event.email.js';

 const transporter = nodemailer.createTransport({
        service: EMAIL_SERVICE,
        host: `smtp.${EMAIL_SERVICE}.com`,
        secure: true,
        port: 465,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASSWORD
        }
    });

export const sendemail = async ({to,cc,bcc,subject,html, attachments=[] }={}) => {
   
    try {
        const info = await transporter.sendMail({
            from: {
                address: EMAIL_USER,
                name: "Sraha App"
            },
            to,
            cc,
            bcc,
            subject,
            html,
            attachments
        });
        console.log("Email sent: " + info.response);
        return info
    } catch (error) {
        console.error("Error sending email:", error);
    }
}


export const resendOtp =async (email , subject) => {
      
      const isBlocked = await ttl(blockOtpKey(email,subject))
      if (isBlocked>0) {
        throw throwError(`Cannot request new otp while are blocked thy again after ${isBlocked} seconds`)
      }
    
    const maxTrial = await get({ key: maxAttemptOtpKey(email,subject) })  
      if (maxTrial>=3) {
        await set({
          key: blockOtpKey(email,subject) ,
          value: 1,
          ttl: 10 * 60
        })
        throw throwError("cannot request new otp you reached the limit")
      }
    
      const otp = generateOtp();
        await set({
          key: baseOtpKey(email,subject),
          value: await hashOtb(otp),
          ttl: 360 // 5 minutes
        });
      
    emailEvent.emit('sendEmail' , async () => {
        await sendemail({
            to: email,
            subject: "Welcome to Sraha App - Verify Your Email",
            html: emailTemplate(otp , `Confirm Your Email `)
        });
        const incrResult = await incr(maxAttemptOtpKey(email, subject))
        if (incrResult==1) {
            await expire(maxAttemptOtpKey(email, subject), 360)
        }
    })        
}

export const verifyOtb = async (otp, email, subject) => { 
    
    const record = await get({ key: baseOtpKey(email,subject) });
    if (!record) {
        throw  throwError("No OTP record found for this email", 404);
    }
    const isValidOtp = await compareOtb(otp, record);
    if (!isValidOtp) {
        throw  throwError("Invalid OTP", 400);
    }
   
    const prefix =await allKeysByPrefix(baseOtpKey(email,subject));
    await deleteKey(prefix);
    return true;
}
