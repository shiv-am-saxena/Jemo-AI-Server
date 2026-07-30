import Document, { ObjectId } from 'mongoose';

interface IUser extends Document {
    _id: ObjectId;
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    githubId?: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default IUser;