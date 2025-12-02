import { Router } from "express";
import { checkAuth, facultyLoginAuth, facultyLogoutAuth, studentLoginAuth, studentLogoutAuth, updateFacultyDetails, updateStudentDetails } from "../controllers/auth.controller.js";
import { studentAuthCheck } from "../middlewares/studentauth.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { facultyAuthCheck } from "../middlewares/facultyAuthCheck.middleware.js";

const authRouter = Router();

authRouter.post('/studentlogin',studentLoginAuth)
authRouter.post('/studentlogout',studentAuthCheck,studentLogoutAuth)
authRouter.post('/studentUpdate',authMiddleware, updateStudentDetails)
authRouter.post('/facultylogin',facultyLoginAuth)
authRouter.post('/facultylogout',authMiddleware,facultyLogoutAuth)
authRouter.get('/checkAuth',authMiddleware,checkAuth)
authRouter.post('/facultyupdate',authMiddleware,updateFacultyDetails)
export default authRouter;