import { Schema, model } from 'mongoose';
import IUser from '../types/user';

const userSchema = new Schema<IUser>(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, select: false },
		googleId: { type: String, unique: true, sparse: true, select: false },
		githubId: { type: String, unique: true, sparse: true, select: false },
		isVerified: { type: Boolean, default: false }
	},
	{
		timestamps: true,
		versionKey: false
	}
);

const User = model<IUser>('User', userSchema);

export default User;
