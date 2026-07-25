import { Router } from 'express';
import {
	register,
	registerWithGoogle,
	verifyEmail
} from '../controllers/auth/register';
import passport from '../services/passport';
import { handleGithubAuthCallback, handleGoogleAuthCallback, login } from '../controllers/auth/login';
import { isLoggedIn } from '../middlewares/isLoggedIn';
import { fetchProfile } from '../controllers/auth/me';

const router = Router();

router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.get('/me', isLoggedIn, fetchProfile);

router.get(
	'/google/register',
	passport.authenticate('google-signup', { scope: ['profile', 'email'] })
);

router.get('/google/register/callback', registerWithGoogle);
router.get(
    '/google',
    passport.authenticate('google-signin', { scope: ['profile', 'email'] })
);
router.get(
    '/google/callback',
    handleGoogleAuthCallback
);

router.get(
	'/github',
	passport.authenticate('github', { scope: ['user:email', 'read:user'] })
);
router.get('/github/callback', handleGithubAuthCallback);

export default router;
