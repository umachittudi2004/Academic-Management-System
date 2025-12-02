import express from 'express';
import { getAuthUrl, getTokensFromCode, isAuthorized } from '../lib/googleDrive.js';

const oauthRouter = express.Router();

// Check authorization status
oauthRouter.get('/api/oauth/status', (req, res) => {
    res.json({ 
        authorized: isAuthorized(),
        message: isAuthorized() ? 'Google Drive connected' : 'Need authorization'
    });
});

// Get authorization URL
oauthRouter.get('/api/oauth/authorize', (req, res) => {
    const authUrl = getAuthUrl();
    res.json({ authUrl });
});

// OAuth callback - THIS catches /oauth2callback
oauthRouter.get('/oauth2callback', async (req, res) => {
    try {
        console.log('🔔 OAuth callback received');
        console.log('📋 Query params:', req.query);
        
        const { code } = req.query;
        
        if (!code) {
            console.error('❌ No authorization code received');
            return res.status(400).send(`
                <html>
                    <body style="font-family: Arial; text-align: center; padding: 50px; background: #1a1a1a; color: #fff;">
                        <h1 style="color: #f44336;">❌ Error</h1>
                        <p>Authorization code not provided</p>
                        <p style="color: #999; margin-top: 20px;">Please try again.</p>
                    </body>
                </html>
            `);
        }

        console.log('🔑 Exchanging code for tokens...');
        await getTokensFromCode(code);
        console.log('✅ Authorization complete!');
        
        res.send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px; background: #1a1a1a; color: #fff;">
                    <h1 style="color: #22c55e;">✅ Authorization Successful!</h1>
                    <p style="font-size: 18px; margin: 20px 0;">Google Drive has been connected successfully.</p>
                    <p style="color: #999;">You can close this window and return to your application.</p>
                    <p style="margin-top: 30px;">
                        <a href="http://localhost:3000/api/oauth/status" 
                           style="color: #60a5fa; text-decoration: none;">
                            Check Authorization Status →
                        </a>
                    </p>
                    <script>
                        setTimeout(() => {
                            window.close();
                        }, 5000);
                    </script>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('❌ OAuth callback error:', error);
        res.status(500).send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px; background: #1a1a1a; color: #fff;">
                    <h1 style="color: #f44336;">❌ Authorization Failed</h1>
                    <p style="color: #ff6b6b;">${error.message}</p>
                    <p style="color: #999; margin-top: 20px;">Please try again.</p>
                </body>
            </html>
        `);
    }
});

export default oauthRouter;