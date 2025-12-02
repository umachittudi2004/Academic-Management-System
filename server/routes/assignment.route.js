import { Router } from "express";
import {
    createAssignment,
    getFacultyAssignments,
    getAssignmentDetails,
    updateAssignment,
    deleteAssignment,
    getAssignmentSubmissions,
    gradeSubmission,
    getAssignmentStats,
    getStudentAssignments,
    submitAssignment,
    getMySubmission,
    getMyGrade
} from "../controllers/assignment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { facultyAuthCheck } from "../middlewares/facultyAuthCheck.middleware.js";
import { studentAuthCheck } from "../middlewares/studentauth.middleware.js";
import { assignmentUpload } from "../lib/multer.config.js";  // ← Use assignmentUpload

const assignmentRouter = Router();

// ========== FACULTY ROUTES ==========
assignmentRouter.post("/create", 
    authMiddleware, 
    facultyAuthCheck, 
    assignmentUpload.array('attachments', 5),  // ← Use assignmentUpload
    createAssignment
);
assignmentRouter.get("/faculty", authMiddleware, facultyAuthCheck, getFacultyAssignments);
assignmentRouter.get("/faculty/:id", authMiddleware, facultyAuthCheck, getAssignmentDetails);
assignmentRouter.put("/update/:id", authMiddleware, facultyAuthCheck, updateAssignment);
assignmentRouter.delete("/delete/:id", authMiddleware, facultyAuthCheck, deleteAssignment);
assignmentRouter.get("/:id/submissions", authMiddleware, facultyAuthCheck, getAssignmentSubmissions);
assignmentRouter.post("/grade", authMiddleware, facultyAuthCheck, gradeSubmission);
assignmentRouter.get("/:id/stats", authMiddleware, facultyAuthCheck, getAssignmentStats);

// ========== STUDENT ROUTES ==========
assignmentRouter.get("/student", authMiddleware, studentAuthCheck, getStudentAssignments);
assignmentRouter.post("/submit", 
    authMiddleware, 
    studentAuthCheck, 
    assignmentUpload.array('files', 5),  // ← Use assignmentUpload with 'files' key
    submitAssignment
);
assignmentRouter.get("/:id/my-submission", authMiddleware, studentAuthCheck, getMySubmission);
assignmentRouter.get("/:id/my-grade", authMiddleware, studentAuthCheck, getMyGrade);

// ========== COMMON ROUTES ==========
assignmentRouter.get("/:id", authMiddleware, getAssignmentDetails);

export default assignmentRouter;