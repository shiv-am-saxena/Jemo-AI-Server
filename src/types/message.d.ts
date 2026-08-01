import mongoose from "mongoose";

interface IMessage extends Document {
    _id: mongoose.Types.ObjectId;
    chatId: mongoose.Types.ObjectId;
    direction: "inbound" | "outbound";
    content: {
        text: string,
        media?: {
            url: string;
            imagekitId: string;
            fileType: string;
        }[]
    };
    aiModel: string;
    createdAt: Date;
    updatedAt: Date;
}

export { IMessage };