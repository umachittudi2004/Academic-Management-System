import { Router } from "express";
import {
    sendMessage,
    broadcastMessage,
    getInbox,
    getSentMessages,
    getThread,
    markAsRead,
    getUnreadCount,
    getConversations,
    archiveMessage,
    deleteMessage,
    getStudentList,
    getFacultyList
} from "../controllers/message.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { facultyAuthCheck } from "../middlewares/facultyAuthCheck.middleware.js";
import { studentAuthCheck } from "../middlewares/studentauth.middleware.js";
import { upload } from "../lib/multer.config.js";

const messageRouter = Router();

// ========== COMMON ROUTES (Student & Faculty) ==========
messageRouter.post("/send", 
    authMiddleware, 
    upload.array('attachments', 3), 
    sendMessage
);
messageRouter.get("/inbox", authMiddleware, getInbox);
messageRouter.get("/sent", authMiddleware, getSentMessages);
messageRouter.get("/thread/:threadId", authMiddleware, getThread);
messageRouter.post("/mark-read/:id", authMiddleware, markAsRead);
messageRouter.get("/unread-count", authMiddleware, getUnreadCount);
messageRouter.get("/conversations", authMiddleware, getConversations);
messageRouter.post("/archive/:id", authMiddleware, archiveMessage);
messageRouter.delete("/:id", authMiddleware, deleteMessage);

// ========== FACULTY ONLY ROUTES ==========
messageRouter.post("/broadcast", 
    authMiddleware, 
    facultyAuthCheck, 
    upload.array('attachments', 3), 
    broadcastMessage
);
messageRouter.get("/students", authMiddleware, facultyAuthCheck, getStudentList);

// ========== STUDENT ONLY ROUTES ==========
messageRouter.get("/faculty-list", authMiddleware, studentAuthCheck, getFacultyList);

export default messageRouter;