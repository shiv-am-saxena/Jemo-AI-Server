import Document from 'mongoose';

interface User extends Document {
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    githubId?: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default User;