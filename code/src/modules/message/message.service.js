import { throwError } from "../../common/index.js"
import { create, deleteOne, findAll, findById, findOne, MessageModel, UserModel } from "../../db/index.js"


export const sendMessage = async (receiverId, { content = undefined, senderId } = {}, files,user) => {
    const account = await findById(UserModel, receiverId)
    if (!account) {
        throw  throwError("we cannot find this account",404)
    }
    const message = await create(
        MessageModel,
        { receiverId, content, senderId: user? user._id : undefined  , attachments: files.map(file => file.finalPath) }
    )
    return message
} 


export const getMessage = async (messageId, user) => {
    const message = findOne(MessageModel, {
        _id: messageId,
        $or: [
            {receiverId:user._id},
            {senderId:user._id}
        ]
    }, {projection:"-senderId"})
    if (!message) {
        throw throwError('message not found or not authorized action',404)
    }
    return message
}
export const getAllMessages = async (user) => {
    const message = findAll(MessageModel, {
        $or: [
            {receiverId:user._id},
            {senderId:user._id}
        ]
    }, {projection:"-senderId"})
    if (!message) {
        throw throwError('message not found or not authorized action',404)
    }
    return message
}
export const delMessage = async (messageId, user) => {
    const message =await deleteOne(MessageModel, {
        _id: messageId,
        receiverId: user._id
    })
    
    if (!message) {
        throw throwError('message not found or not authorized action',404)
    }
    return message
}