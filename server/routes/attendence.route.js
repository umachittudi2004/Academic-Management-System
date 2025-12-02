import { Router } from "express";
import { studentAuthCheck } from "../middlewares/studentauth.middleware.js";
import { checkAttendenceSession, markAttendence, startAttendenceSession } from "../controllers/attendence.controller.js";
import { facultyAuthCheck } from "../middlewares/facultyAuthCheck.middleware.js";
import { checkIp } from "../middlewares/checkIp.middleware.js";
import {authMiddleware} from "../middlewares/auth.middleware.js"
const attendenceRouter = Router();

attendenceRouter.post("/startattendencesession",authMiddleware,facultyAuthCheck,startAttendenceSession)
attendenceRouter.get("/checkattendencesession",studentAuthCheck,checkAttendenceSession)
attendenceRouter.get("/markattendence/:id",studentAuthCheck,checkIp,markAttendence)

export default attendenceRouter;