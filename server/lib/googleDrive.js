// import { google } from 'googleapis';
// import fs from 'fs';
// import path from 'path';

// // Initialize OAuth2 client
// const oauth2Client = new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     process.env.GOOGLE_REDIRECT_URI
// );

// // Token storage file path
// const TOKEN_PATH = path.join(process.cwd(), 'google-drive-token.json');

// /**
//  * Load saved tokens if they exist
//  */
// export const loadTokens = () => {
//     try {

//          if (process.env.GOOGLE_DRIVE_TOKENS) {
//             console.log('🔑 Loading Google Drive tokens from environment.. .');
//             const tokens = JSON.parse(process.env.GOOGLE_DRIVE_TOKENS);
//             oauth2Client. setCredentials(tokens);
//             console.log('✅ Google Drive tokens loaded from environment');
//             return true;
//         }

//         if (fs.existsSync(TOKEN_PATH)) {
//             const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
//             oauth2Client.setCredentials(tokens);
//             console.log('✅ Google Drive tokens loaded');
//             return true;
//         }
//         console.log('⚠️ No saved tokens found. Need to authorize.');
//         return false;
//     } catch (error) {
//         console.error('❌ Error loading tokens:', error.message);
//         return false;
//     }
// };

// /**
//  * Save tokens to file
//  */
// export const saveTokens = (tokens) => {
//     try {
//         fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
//         oauth2Client.setCredentials(tokens);
//         console.log('✅ Tokens saved successfully in file');
//         console.log('\n🔔 IMPORTANT: For production deployment, add this to environment variables:');
//         console.log('GOOGLE_DRIVE_TOKENS=' + JSON.stringify(tokens));
//         console.log('\n');

//         return true;
//     } catch (error) {
//         console.error('❌ Error saving tokens:', error.message);
//         return false;
//     }
// };

// /**
//  * Generate authorization URL
//  */
// export const getAuthUrl = () => {
//     const scopes = ['https://www.googleapis.com/auth/drive.file'];
    
//     return oauth2Client.generateAuthUrl({
//         access_type: 'offline',
//         scope: scopes,
//         prompt: 'consent'
//     });
// };

// /**
//  * Exchange authorization code for tokens
//  */
// export const getTokensFromCode = async (code) => {
//     try {
//         const { tokens } = await oauth2Client.getToken(code);
//         saveTokens(tokens);
//         return tokens;
//     } catch (error) {
//         console.error('❌ Error getting tokens:', error.message);
//         throw error;
//     }
// };

// /**
//  * Get or create app folder in Google Drive
//  */
// let APP_FOLDER_ID = null;

// const getOrCreateAppFolder = async (drive) => {
//     try {
//         if (APP_FOLDER_ID) return APP_FOLDER_ID;

//         const folderName = process.env.GOOGLE_DRIVE_FOLDER_NAME || 'Department-App-Files';

//         // Search for existing folder
//         const response = await drive.files.list({
//             q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
//             fields: 'files(id, name)',
//             spaces: 'drive'
//         });

//         if (response.data.files.length > 0) {
//             APP_FOLDER_ID = response.data.files[0].id;
//             console.log('✅ Found existing folder:', folderName);
//             return APP_FOLDER_ID;
//         }

//         // Create new folder
//         const folder = await drive.files.create({
//             requestBody: {
//                 name: folderName,
//                 mimeType: 'application/vnd.google-apps.folder'
//             },
//             fields: 'id'
//         });

//         APP_FOLDER_ID = folder.data.id;
//         console.log('✅ Created new folder:', folderName);
//         return APP_FOLDER_ID;
//     } catch (error) {
//         console.error('❌ Error with app folder:', error.message);
//         throw error;
//     }
// };

// /**
//  * Upload file to Google Drive
//  */
// export const uploadToDrive = async (filePath, fileName, mimeType, folderName = 'Notices') => {
//     try {
//         const drive = google.drive({ version: 'v3', auth: oauth2Client });

//         // Get or create main app folder
//         const appFolderId = await getOrCreateAppFolder(drive);

//         // Create subfolder (e.g., Notices, Assignments)
//         const subfolderResponse = await drive.files.list({
//             q: `name='${folderName}' and '${appFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
//             fields: 'files(id, name)'
//         });

//         let subfolderId;
//         if (subfolderResponse.data.files.length > 0) {
//             subfolderId = subfolderResponse.data.files[0].id;
//         } else {
//             const subfolder = await drive.files.create({
//                 requestBody: {
//                     name: folderName,
//                     mimeType: 'application/vnd.google-apps.folder',
//                     parents: [appFolderId]
//                 },
//                 fields: 'id'
//             });
//             subfolderId = subfolder.data.id;
//         }

//         // Upload file
//         const fileMetadata = {
//             name: fileName,
//             parents: [subfolderId]
//         };

//         const media = {
//             mimeType: mimeType,
//             body: fs.createReadStream(filePath)
//         };

//         const file = await drive.files.create({
//             requestBody: fileMetadata,
//             media: media,
//             fields: 'id, name, size, webViewLink, webContentLink'
//         });

//         // Make file accessible to anyone with link
//         await drive.permissions.create({
//             fileId: file.data.id,
//             requestBody: {
//                 role: 'reader',
//                 type: 'anyone'
//             }
//         });

//         console.log('✅ File uploaded to Google Drive:', fileName);
//         console.log('📋 File ID:', file.data.id);

//         return {
//             fileId: file.data.id,
//             webViewLink: file.data.webViewLink || `https://drive.google.com/file/d/${file.data.id}/view`,
//             webContentLink: `https://drive.google.com/uc?export=download&id=${file.data.id}`,
//             resourceType: mimeType.startsWith('image/') ? 'image' : 'raw',
//             format: path.extname(fileName).substring(1),
//             bytes: parseInt(file.data.size) || 0
//         };
//     } catch (error) {
//         console.error('❌ Upload to Google Drive failed:', error.message);
//         throw error;
//     }
// };

// /**
//  * Delete file from Google Drive
//  */
// export const deleteFromDrive = async (fileId) => {
//     try {
//         const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
//         await drive.files.delete({
//             fileId: fileId
//         });

//         console.log('✅ File deleted from Google Drive:', fileId);
//         return true;
//     } catch (error) {
//         console.error('❌ Delete from Google Drive failed:', error.message);
//         return false;
//     }
// };

// /**
//  * Check if authorized
//  */
// export const isAuthorized = () => {
//     return !!process.env.GOOGLE_DRIVE_TOKENS || fs.existsSync(TOKEN_PATH);
// };

// // Load tokens on initialization
// loadTokens();




///////////////////////////////////////

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Token storage file path
const TOKEN_PATH = path.join(process.cwd(), 'google-drive-token.json');

/**
 * Load tokens from environment or file
 */
export const loadTokens = () => {
    try {
        let tokens = null;

        // PRIORITY 1: Try loading from environment variables (for production)
        if (process.env.GOOGLE_DRIVE_TOKENS) {
            console.log('🔑 Loading Google Drive tokens from environment...');
            tokens = JSON.parse(process.env.GOOGLE_DRIVE_TOKENS);
        }
        // PRIORITY 2: Try loading from file (for local development)
        else if (fs.existsSync(TOKEN_PATH)) {
            console.log('🔑 Loading Google Drive tokens from file...');
            tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
        }

        if (tokens) {
            oauth2Client.setCredentials(tokens);
            
            // Set up automatic token refresh
            oauth2Client.on('tokens', (newTokens) => {
                console.log('🔄 Tokens refreshed automatically');
                if (newTokens.refresh_token) {
                    tokens.refresh_token = newTokens.refresh_token;
                }
                tokens.access_token = newTokens.access_token;
                tokens.expiry_date = newTokens.expiry_date;
                
                // Save updated tokens
                if (process.env.NODE_ENV !== 'production' && fs.existsSync(TOKEN_PATH)) {
                    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
                }
            });

            console.log('✅ Google Drive tokens loaded successfully');
            return true;
        }

        console.log('⚠️ No saved tokens found. Need to authorize.');
        return false;
    } catch (error) {
        console.error('❌ Error loading tokens:', error.message);
        return false;
    }
};

/**
 * Save tokens to file (local dev only) AND log for production
 */
export const saveTokens = (tokens) => {
    try {
        // Save to file for local development
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        oauth2Client.setCredentials(tokens);
        
        console.log('✅ Tokens saved successfully to file');
        console.log('\n🔔 IMPORTANT: For production deployment, add this to environment variables:');
        console.log('GOOGLE_DRIVE_TOKENS=' + JSON.stringify(tokens));
        console.log('\n');
        
        return true;
    } catch (error) {
        console.error('❌ Error saving tokens:', error.message);
        return false;
    }
};

/**
 * Generate authorization URL
 */
export const getAuthUrl = () => {
    const scopes = ['https://www.googleapis.com/auth/drive.file'];
    
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });
};

/**
 * Exchange authorization code for tokens
 */
export const getTokensFromCode = async (code) => {
    try {
        const { tokens } = await oauth2Client.getToken(code);
        saveTokens(tokens);
        return tokens;
    } catch (error) {
        console.error('❌ Error getting tokens:', error.message);
        throw error;
    }
};

/**
 * Get or create app folder in Google Drive
 */
let APP_FOLDER_ID = null;

const getOrCreateAppFolder = async (drive) => {
    try {
        if (APP_FOLDER_ID) return APP_FOLDER_ID;

        const folderName = process.env.GOOGLE_DRIVE_FOLDER_NAME || 'Department-App-Files';

        // Search for existing folder
        const response = await drive.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        if (response.data.files.length > 0) {
            APP_FOLDER_ID = response.data.files[0].id;
            console.log('✅ Found existing folder:', folderName);
            return APP_FOLDER_ID;
        }

        // Create new folder
        const folder = await drive.files.create({
            requestBody: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            },
            fields: 'id'
        });

        APP_FOLDER_ID = folder.data.id;
        console.log('✅ Created new folder:', folderName);
        return APP_FOLDER_ID;
    } catch (error) {
        console.error('❌ Error with app folder:', error.message);
        throw error;
    }
};

/**
 * Upload file to Google Drive
 */
export const uploadToDrive = async (filePath, fileName, mimeType, folderName = 'Notices') => {
    try {
        // Ensure we have valid credentials
        const credentials = oauth2Client.credentials;
        if (!credentials || !credentials.access_token) {
            throw new Error('No valid credentials. Please authorize first.');
        }

        // Check if token is expired and refresh if needed
        if (credentials.expiry_date && credentials.expiry_date < Date.now()) {
            console.log('🔄 Access token expired, refreshing...');
            await oauth2Client.refreshAccessToken();
        }

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Get or create main app folder
        const appFolderId = await getOrCreateAppFolder(drive);

        // Create subfolder (e.g., Notices, Assignments)
        const subfolderResponse = await drive.files.list({
            q: `name='${folderName}' and '${appFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)'
        });

        let subfolderId;
        if (subfolderResponse.data.files.length > 0) {
            subfolderId = subfolderResponse.data.files[0].id;
        } else {
            const subfolder = await drive.files.create({
                requestBody: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [appFolderId]
                },
                fields: 'id'
            });
            subfolderId = subfolder.data.id;
        }

        // Upload file
        const fileMetadata = {
            name: fileName,
            parents: [subfolderId]
        };

        const media = {
            mimeType: mimeType,
            body: fs.createReadStream(filePath)
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, size, webViewLink, webContentLink'
        });

        // Make file accessible to anyone with link
        await drive.permissions.create({
            fileId: file.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        console.log('✅ File uploaded to Google Drive:', fileName);
        console.log('📋 File ID:', file.data.id);

        return {
            fileId: file.data.id,
            webViewLink: file.data.webViewLink || `https://drive.google.com/file/d/${file.data.id}/view`,
            webContentLink: `https://drive.google.com/uc?export=download&id=${file.data.id}`,
            resourceType: mimeType.startsWith('image/') ? 'image' : 'raw',
            format: path.extname(fileName).substring(1),
            bytes: parseInt(file.data.size) || 0
        };
    } catch (error) {
        console.error('❌ Upload to Google Drive failed:', error.message);
        console.error('Error details:', error);
        throw error;
    }
};

/**
 * Delete file from Google Drive
 */
export const deleteFromDrive = async (fileId) => {
    try {
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        await drive.files.delete({
            fileId: fileId
        });

        console.log('✅ File deleted from Google Drive:', fileId);
        return true;
    } catch (error) {
        console.error('❌ Delete from Google Drive failed:', error.message);
        return false;
    }
};

/**
 * Check if authorized
 */
export const isAuthorized = () => {
    return !!process.env.GOOGLE_DRIVE_TOKENS || fs.existsSync(TOKEN_PATH);
};

// Load tokens on initialization
loadTokens();