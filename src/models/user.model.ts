import { Schema, model } from 'mongoose';
import UserType from '../types/user'; // Renamed import to avoid naming collision with the model
import bcrypt from 'bcrypt';

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

userSchema.pre('save', async function () {
	// 1. Check if password was modified AND actually exists (bypasses OAuth users)
	if (!this.isModified('password') || !this.password) {
		return;
	}

	try {
		this.password = await bcrypt.hash(this.password, 12);
	} catch (error: any) {
		console.error('Error hashing password:', error);
		throw error;
	}
});

userSchema.methods.comparePassword = async function (
	candidatePassword: string
): Promise<boolean> {
	if (!this.password) return false;

	return await bcrypt.compare(candidatePassword, this.password);
};

const User = model<UserType>('User', userSchema);

export default User;
