import { Router } from "express";
import { createSubject, getAllSubjects, getSubjectById, getSubjectsByFaculty, getSubjectByYearBranchSection} from "../controllers/subject.controller.js";
import { studentAuthCheck } from "../middlewares/studentauth.middleware.js";
import { facultyAuthCheck } from "../middlewares/facultyAuthCheck.middleware.js";
import {authMiddleware} from "../middlewares/auth.middleware.js"

const subjectRouter = Router();

subjectRouter.post("/createsubject",authMiddleware,facultyAuthCheck, createSubject);
subjectRouter.get("/getallsubjects", studentAuthCheck, getAllSubjects);
subjectRouter.post("/getsubjectbyid/:ids", studentAuthCheck,getSubjectById);
subjectRouter.get("/getsubjectsbyfaculty", authMiddleware, facultyAuthCheck, getSubjectsByFaculty);
subjectRouter.get("/getsubjectbyyearbranchsection", studentAuthCheck, getSubjectByYearBranchSection);

export default subjectRouter;