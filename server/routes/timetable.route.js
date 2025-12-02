import { Router } from "express";
import {
    createTimetableEntry,
    getFacultyTimetable,
    getCurrentPeriod,
    deleteTimetableEntry,
    getStudentTimetable
} from "../controllers/timetable.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { facultyAuthCheck } from "../middlewares/facultyAuthCheck.middleware.js";
import { studentAuthCheck } from "../middlewares/studentauth.middleware.js";  // ← CORRECTED

const timetableRouter = Router();

// Faculty routes
timetableRouter.post("/create", authMiddleware, facultyAuthCheck, createTimetableEntry);
timetableRouter.get("/faculty", authMiddleware, facultyAuthCheck, getFacultyTimetable);
timetableRouter.get("/current-period", authMiddleware, facultyAuthCheck, getCurrentPeriod);
timetableRouter.delete("/delete/:id", authMiddleware, facultyAuthCheck, deleteTimetableEntry);

// Student route
timetableRouter.get("/student", authMiddleware, studentAuthCheck, getStudentTimetable);

export default timetableRouter;