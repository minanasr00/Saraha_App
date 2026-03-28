import { fileFieldValidation, localFileUpload, successResponse } from "../../common/index.js";
import { Router } from "express";
import { coverPicture, login, profile, ProfileLogout, ProfilePicture, requestForgotPassword, resetForgotPassword, rotateTokens, sendOtb, SharedProfile, signup, updatePassword, varifyForgetPassword, verifingEmailOtb,} from './user.service.js';
import { TokenTypeEnum } from "../../common/enums/tokenType.enums.js";
import { authentication, validateRequest } from "../../middleWares/index.js";
import { confirmEamilSchema, CoverPictureSchema, loginschema, ProfilePictureSchema, resendConfirmEamilSchema, resetForgotPasswordSchema, shareProfileSchema, signupschema, updatePasswordSchema } from "./user.validation.js";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { redisClient } from "../../db/index.js";

 const limiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    limit: 5,
    requestPropertyName: "rateLimit",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    keyGenerator: (req, res, next)=>{
      const ip = ipKeyGenerator(req.ip, 56)
      console.log(`${ip}-${req.path}`);
      return `${ip}-${req.path}`
    },
    store: {
    async incr(key, cb) { // get called by keyGenerator
      try {
        const count = await redisClient.incr(key);
        if (count === 1) await redisClient.expire(key, 120); // 2 min TTL
        cb(null, count);
      } catch (err) {
        cb(err);
      }
    },
 
    async decrement(key) {  // called by kipFailedRequests:true ,  skipSuccessfulRequests:true,
      await redisClient.decr(key);
    },
  },
  
})

const router = Router();



router.patch('/profile-image',
  authentication(),
  localFileUpload({ customPath: 'users/profile', validation: fileFieldValidation.images, maxSize: 5 }).single('attachment'),
  validateRequest(ProfilePictureSchema),
  async (req, res, next) => { 
    const prfileImage = await ProfilePicture(req.user, req.file.finalPath);
    return successResponse({
      res,
      statusCode: 200,
      message: "profile picture updated successfully",
      data: req.file,
    });
  }
);

router.patch('/cover-image',
  authentication(),
  localFileUpload({ customPath: 'users/cover', validation: fileFieldValidation.images, maxSize: 5 }).array('attachments', 3),
  validateRequest(CoverPictureSchema),
  async (req, res, next) => { 
    const coverImage = await coverPicture(req.user, req.files);
    return successResponse({
      res,
      statusCode: 200,
      message: "cover image updated successfully",
      data: coverImage,
    });
  }
);

router.post("/signup", validateRequest(signupschema), async (req, res, next) => {
    const user = await signup(req.body);

    return successResponse({
      res,
      statusCode: 201,
      message: "user created successfully and OTP sent to email",
      data: user,
    });
});


router.post("/login", limiter, validateRequest(loginschema), async (req, res, next) => {
  try {
    const user = await login(req.body, `${req.protocol}://${req.host}`);
    const delResult = await redisClient.del(`${req.ip}-${req.path}`)
    console.log(delResult);
    return successResponse({
      res,
      statusCode: 200,
      message: "user logged in successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/profile", authentication(TokenTypeEnum.ACCESS), async (req, res, next) => { 
  const result = await profile(req.user);
  return successResponse({
    res,
    statusCode: 200,
    message: "user profile retrieved successfully",
    data: result,
  });
})

router.post("/rotate-tokens", authentication(TokenTypeEnum.REFRESH), async (req, res, next) => {
  try {
    const tokens = await rotateTokens(req.user, req.decoded , `${req.protocol}://${req.host}`);
    return successResponse({
      res,
      statusCode: 200,
      message: "tokens rotated successfully",
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/send-otb",validateRequest(resendConfirmEamilSchema) ,async (req, res, next) => {
  const sendOtbResult = await sendOtb(req.body.email);
  return successResponse({
    res,
    statusCode: 200,
    message: "OTP sent successfully",
    data: sendOtbResult,
  })
})
router.post("/verify-email-otb",validateRequest(confirmEamilSchema) , async (req, res, next) => {
  const verifyOtbResult = await verifingEmailOtb(req.body.otp, req.body.email);
  return successResponse({
    res,
    statusCode: 200,
    message: "OTP verified successfully",
    data: verifyOtbResult,
  })
})

router.post("/logout", authentication(TokenTypeEnum.ACCESS), async (req, res, next) => {
  const logoutResult = await ProfileLogout(req.body.flag , req.user ,req.decoded);
  return successResponse({
    res,
    statusCode: logoutResult.status,
    message: "user logged out successfully",
    data: logoutResult,
  })
 })

router.get('/:id/shared', validateRequest(shareProfileSchema), async (req, res, next) => { 
  const account = await SharedProfile(req.params.id);
  return successResponse({
    res,
    statusCode: 200,
    message: "shared profile retrieved successfully",
    data: account,
  });
})

router.post("/forget-password-otp",validateRequest(resendConfirmEamilSchema) ,async (req,res,next) => {
  const result = await requestForgotPassword(req.body.email)
  return successResponse({ res, message:"otp send successfully", data: result })
})

router.patch("/varify-password-otp",validateRequest(confirmEamilSchema) ,  async (req, res, next) => {
  const result = await varifyForgetPassword(req.body)
  return successResponse({ res, message:result})
})

router.patch("/reset-forgot-password", validateRequest(resetForgotPasswordSchema),async (req , res , next) => {
  const tokens = await resetForgotPassword(req.body, `${req.protocol}://${req.host}`) 
  return successResponse({res , message:`Password Updated Successfully` , data:tokens })
})

router.patch('/update-password',
  authentication(TokenTypeEnum.ACCESS),
  validateRequest(updatePasswordSchema),
  async (req, res, next) => {
    const tokens = await updatePassword(req.user, req.body)
    return successResponse({
      res, 
      message: "password Updated Successfully",
      data:tokens
    })
})
export default router;
