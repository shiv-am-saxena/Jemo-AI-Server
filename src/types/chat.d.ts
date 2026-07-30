import { Document, ObjectId } from "mongoose";

interface IChat extends Document {
    userId: ObjectId;
    title: string;
    visibility: "private" | "public";
    createdAt: Date;
    updatedAt: Date;
}
export { IChat };