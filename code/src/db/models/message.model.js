import mongoose from "mongoose";


const messageShcema = new mongoose.Schema({
    content: {
        type: String,
        mixLenght : 2,
        maxLenght: 10000,
        require: () => {
            return !this.attachments?.lenght
        }
    },
    attachments: {
        type : [String]
    }
    ,
    receiverId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        require: true
    },
    senderId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps:true
})

export const MessageModel = mongoose.models.Message || mongoose.model("Message",messageShcema)