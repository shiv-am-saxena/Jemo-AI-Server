import mongoose from "mongoose";
import { IChat } from "../types/chat";

const chatSchema = new mongoose.Schema<IChat>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    visibility: {
        type: String,
        enum: ["private", "public"],
        default: "private",
    },
}, {
    timestamps: true,
    versionKey: false,
});

const ChatModel = mongoose.model<IChat>("Chat", chatSchema);

export default ChatModel;