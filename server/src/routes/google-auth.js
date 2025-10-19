import { Router } from "express";
import { googleClient } from "../app.js";

const router = Router();

router.get('/google-auth', (req, res) => {
  try {
      const authUrl = googleClient.generateAuthUrl({
          access_type: 'offline',
          scope: [ 'https://www.googleapis.com/auth/calendar', 'https://mail.google.com/'],
          prompt: 'consent'
      })
      res.redirect(authUrl)
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate Google authentication URL' })
  }
})

router.get('/redirect', async (req, res) => {
  try {
    const { code } = req.query;
    console.log(code);
    const response = await googleClient.getToken(code);
    console.log(response);
    googleClient.setCredentials(response.tokens);
    res.status(200).json({ success: true, message: 'Google authentication successful', data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to authenticate with Google' })
  }
})

export default router;