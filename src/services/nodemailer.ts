import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import logger from './logger';

// 1. Configure the transporter
// We cast the env variables as strings to satisfy TypeScript's strict mode
export const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL_USER as string,
		pass: process.env.EMAIL_PASS as string
	}
});

// 2. Verify the connection on startup
transporter.verify((error: Error | null, success: true) => {
	if (error) {
		logger.error('Error connecting to email service:', error);
	} else {
		logger.info('Email service is ready to send messages');
	}
});

// 3. Strongly typed send function
export const sendVerificationEmail = async (
	userEmail: string,
	verificationToken: string
): Promise<boolean> => {
	try {
		const baseUrl = process.env.BASE_URL as string;
		const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`;

		// Use Mail.Options to strictly type the email configuration
		const mailOptions: Mail.Options = {
			from: `"Jemo" <${process.env.EMAIL_USER}>`,
			to: userEmail,
			subject: 'Please Verify Your Email',
			html: `
        <h2>Welcome to Our App!</h2>
        <p>Click the link below to verify your email address and activate your account:</p>
        <a href="${verificationUrl}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If you did not request this, please ignore this email.</p>
        <br>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
      `
		};

		const info = await transporter.sendMail(mailOptions);
		console.log(`Verification email sent: ${info.messageId}`);

		return true;
	} catch (error) {
		console.error('Error sending verification email:', error);
		throw new Error('Could not send verification email');
	}
};
