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
    const message = await findOne(MessageModel, {
        _id: messageId,
        $or: [
            {receiverId:user._id},
            {senderId:user._id}
        ]
    })
    if (!message) {
        throw throwError('message not found or not authorized action',404)
    }
    
    const messageData = message.toObject();
    messageData.receiverId = messageData.receiverId?.toString();

    if (message.senderId && message.senderId.toString() === user._id.toString()) {
        messageData.senderId = messageData.senderId?.toString();
        return messageData; // include senderId for sent messages
    } else {
        delete messageData.senderId;
        return messageData; // exclude senderId for received messages
    }
}
export const getAllMessages = async (user) => {
    const messages = await findAll(MessageModel, {
        $or: [
            {receiverId:user._id},
            {senderId:user._id}
        ]
    })
    
    return messages.map(msg => {
        const msgData = msg.toObject();
        msgData.receiverId = msgData.receiverId?.toString();

        if (msg.senderId && msg.senderId.toString() === user._id.toString()) {
            msgData.senderId = msgData.senderId?.toString();
            return msgData; // include senderId for sent messages
        } else {
            delete msgData.senderId;
            return msgData; // exclude senderId for received messages
        }
    })
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