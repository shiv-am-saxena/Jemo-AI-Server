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
    comparePassword: (password: string) => Promise<boolean>;
}

export default User;