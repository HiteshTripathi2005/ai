import { Router } from "express";
import { googleClient } from "../app.js";
import User from "../models/User.js";

const router = Router();

router.get('/google-auth', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'Missing userId parameter' });
  }

  try {
      const authUrl = googleClient.generateAuthUrl({
          access_type: 'offline',
          scope: [ 'https://www.googleapis.com/auth/calendar', 'https://mail.google.com/'],
          prompt: 'consent',
          state: userId
      })
      res.redirect(`${authUrl}&`)
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate Google authentication URL' })
  }
})

router.get('/redirect', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Missing authentication code' });
    }
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId in state parameter' });
    }

    console.log(`Authentication code received. User ID: ${userId}`);


    const response = await googleClient.getToken(code);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.googleTokens.tokens = response.tokens;
    await user.save();

    console.log(response);
    googleClient.setCredentials(response.tokens);
    res.status(200).json({ success: true, message: 'Google authentication successful', user_message: 'you can now close this page' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to authenticate with Google' })
  }
})

export default router;