import { Router } from "express";
import {
    createNotice,
    getFacultyNotices,
    getStudentNotices,
    getNoticeById,
    markNoticeAsRead,
    getUnreadCount,
    updateNotice,
    deleteNotice
} from "../controllers/notice.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { facultyAuthCheck } from "../middlewares/facultyAuthCheck.middleware.js";
import { studentAuthCheck } from "../middlewares/studentauth.middleware.js";
import { upload } from "../lib/multer.config.js";

const noticeRouter = Router();

// Faculty routes
noticeRouter.post("/create", authMiddleware, facultyAuthCheck, upload.array('attachments', 3), createNotice);
noticeRouter.get("/faculty/all", authMiddleware, facultyAuthCheck, getFacultyNotices);
noticeRouter.put("/update/:id", authMiddleware, facultyAuthCheck, updateNotice);
noticeRouter.delete("/delete/:id", authMiddleware, facultyAuthCheck, deleteNotice);

// Student routes
noticeRouter.get("/student/all", studentAuthCheck, getStudentNotices);
noticeRouter.get("/student/unread-count", studentAuthCheck, getUnreadCount);
noticeRouter.post("/student/mark-read/:id", studentAuthCheck, markNoticeAsRead);

// Common routes
noticeRouter.get("/:id", studentAuthCheck, getNoticeById);

export default noticeRouter;