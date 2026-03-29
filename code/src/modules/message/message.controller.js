import { Router } from "express"
import { successResponse } from './../../common/reponse/success.response.js';
import { delMessage, getAllMessages, getMessage, sendMessage } from "./message.service.js";
import { decodeToken, errorResponse, fileFieldValidation, localFileUpload } from "../../common/index.js";
import { validateRequest } from './../../middleWares/validation.middleware.js';
import { getMessageShcema, sendMessageShcema } from "./message.validation.js";
import { TokenTypeEnum } from "../../common/enums/tokenType.enums.js";
import { authentication } from './../../middleWares/authentication.middleware.js';

const router = Router()

router.post("/:receiverId",
    localFileUpload({ validation: fileFieldValidation.images, customPath: "Messages" }).array("attachments", 3),
    async (req, res, next) => {
        if (req.headers.authorization) {
            const { user ,decoded} = await decodeToken(req.headers.authorization.split(" ")[1], TokenTypeEnum.ACCESS);
                    
                    req.user = user;
                    req.decoded = decoded;
        }
        next()
    }
    ,
    validateRequest(sendMessageShcema),
    async (req, res, next) => {
        if (!req.body?.content && !req.files?.length) {
            return errorResponse({res,status:400 ,error:{message:"missing content or attachments"}})
        }
        const result = await sendMessage(req.params.receiverId, req.body, req.files, req.user) 
        return successResponse({ res, message: "Message Sent Successfully", data: result }
    )
    })
router.get("/all",
    authentication(TokenTypeEnum.ACCESS),
    async (req, res, next) => {
        const result = await getAllMessages(req.user) 
        return successResponse({ res, message: "done", data: result }
    )
    })

router.get("/:messageId",
    authentication(TokenTypeEnum.ACCESS),
    validateRequest(getMessageShcema),
    async (req, res, next) => {
        const result = await getMessage(req.params.messageId, req.user) 
        return successResponse({ res, message: "done", data: result }
    )
})
router.delete("/:messageId",
    authentication(TokenTypeEnum.ACCESS),
    validateRequest(getMessageShcema),
    async (req, res, next) => {
        const result = await delMessage(req.params.messageId, req.user) 
        return successResponse({ res,statusCode:200, message: "Message Deleted"}
    )
})



export default router


