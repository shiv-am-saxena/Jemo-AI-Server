import mongoose, {ObjectId} from "mongoose";
import { IMessage } from "../types/message";

const messageSchema = new mongoose.Schema<IMessage>({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
    },
    direction: {
        type: String,
        enum: ["inbound", "outbound"],
        required: true,
    },
    content: {
        text: {
            type: String,
            required: true,
        },
        media: [{
            type: String,
        }],
    },
    aiModel: {
        type: String,
    },
}, {
    timestamps: true,
    versionKey: false,
});

const MessageModel = mongoose.model<IMessage>("Message", messageSchema);

export default MessageModel;