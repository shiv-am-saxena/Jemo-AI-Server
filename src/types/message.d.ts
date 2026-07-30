import mongoose from "mongoose";

interface IMessage extends Document {
    _id: mongoose.Types.ObjectId;
    chatId: mongoose.Types.ObjectId;
    direction: "inbound" | "outbound";
    content: {
        text: string,
        media?: string[]
    };
    aiModel: string;
    createdAt: Date;
    updatedAt: Date;
}

export { IMessage };