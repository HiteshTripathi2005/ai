import express from 'express';
import { protect } from '../middleware/auth.js';
import { GetMe, Login, Logout, Register, updateProfile } from '../controllers/auth.controller.js';


const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', Register);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', Login);

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, GetMe);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', Logout);

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, updateProfile);

export default router;
