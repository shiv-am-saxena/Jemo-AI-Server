import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/user.model';
import dotenv from 'dotenv';

// MUST be called before using process.env inside the strategies
dotenv.config();

passport.serializeUser((user: any, done: Function) => {
	done(null, user.id);
});

passport.deserializeUser(async (id: string, done: Function) => {
	try {
		const user = await User.findById(id);
		done(null, user);
	} catch (error) {
		done(error);
	}
});

// ==========================================
// SIGN IN STRATEGIES
// ==========================================

passport.use(
	'google-signin',
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			callbackURL: '/auth/google/callback' // Sign-in callback
		},
		async (
			accessToken: string,
			refreshToken: string,
			profile: any,
			done: Function
		) => {
			try {
				let user = await User.findOne({ email: profile.emails?.[0].value });
				if (!user) {
					return done(null, false, {
						message: 'User not found. Please sign up first.'
					});
				}
				return done(null, user);
			} catch (error) {
				return done(error);
			}
		}
	)
);

// Use just one strategy for GitHub
passport.use('github', new GitHubStrategy(
    {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL: '/auth/github/callback', // Matches the exact URL in the screenshot
    },
    async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
        try {
            // Check if user exists
            let user = await User.findOne({ email: profile.emails?.[0].value }).select("+githubId");

            if (user) {
				// If the user exists but doesn't have a GitHub ID, update it
				if (!user.githubId) {
					user.githubId = profile.id;
					const success = await user.save();
					if (!success) {
						return done(null, false, {
							message: 'Failed to update user with GitHub ID.'
						});
					}
					return done(null, user);
				}
                return done(null, user);
            }

            // 2. User does NOT exist -> Sign them up automatically
            user = new User({
                name: profile.displayName || profile.username,
                email: profile.emails?.[0].value,
                githubId: profile.id,
                isVerified: true,
            });
            await user.save();

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

// ==========================================
// SIGN UP STRATEGIES
// ==========================================

passport.use(
	'google-signup',
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			callbackURL: '/auth/google/register/callback' // MUST be distinct for signup
		},
		async (
			accessToken: string,
			refreshToken: string,
			profile: any,
			done: Function
		) => {
			try {
				let user = await User.findOne({ email: profile.emails?.[0].value });
				if (user) {
					return done(null, false, {
						message: 'User already exists. Please sign in instead.'
					});
				}
				user = new User({
					name: profile.displayName,
					email: profile.emails?.[0].value,
					googleId: profile.id,
					isVerified: true
				});
				user = await user.save();
				if(!user)
					return done(null, false, {
						message: 'Failed to create user.'
					});
				return done(null, user);
			} catch (error) {
				return done(error);
			}
		}
	)
);

export default passport;
