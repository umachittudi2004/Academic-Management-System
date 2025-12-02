import express from 'express';
import { connectDB } from './lib/db.config.js';
import authRouter from './routes/auth.route.js';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import subjectRouter from './routes/subject.route.js';
import attendenceRouter from './routes/attendence.route.js';
import noticeRouter from './routes/notice.route.js';
import oauthRouter from './routes/oauth.route.js';
import timetableRouter from './routes/timetable.route.js';
import groupRouter from './routes/group.route.js'; 
import assignmentRouter from './routes/assignment.route.js';
import messageRouter from './routes/message.route.js'; 
import { setupSocket } from './socket/socket.js';
import { createServer } from 'http'; 

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse allowed origins from environment
const allowedOrigins = process.env.ALLOWED_ORIGINS
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''));

// Middleware
app.use(express.json());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(cookieParser());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// IMPORTANT: OAuth routes MUST come BEFORE /api routes
// This handles Google's redirect to /oauth2callback
app.use('/', oauthRouter);

// API Routes
app.use('/api/userAuth', authRouter);
app.use('/api/subject', subjectRouter);
app.use('/api/attendence', attendenceRouter);
app.use('/api/notice', noticeRouter);
app.use('/api/assignment', assignmentRouter);
app.use('/api/oauth', oauthRouter);
app.use('/api/timetable', timetableRouter);
app.use('/api/group', groupRouter); 
app.use('/api/message', messageRouter); 


// Start server
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Create HTTP server
const server = createServer(app);  // ← ADD THIS

// Setup Socket.io
const io = setupSocket(server);  // ← ADD THIS
app.set('io', io);  // ← ADD THIS - Make io available in routes

// Start Server
server.listen(process.env.PORT, () => {  // ← CHANGE FROM app.listen to server.listen
    connectDB();
    console.log(`Server is running on port ${process.env.PORT}`);
});