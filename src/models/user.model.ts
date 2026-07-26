import { Schema, model } from 'mongoose';
import UserType from '../types/user';

const userSchema = new Schema<UserType>(
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

const User = model<UserType>('User', userSchema);

export default User;
