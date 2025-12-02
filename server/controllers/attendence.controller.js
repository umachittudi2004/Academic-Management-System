import express from 'express';
import { AttendenceAccess } from '../models/attendenceaccess.model.js';
import { Student } from '../models/student.model.js';
import { Attendence } from '../models/attendence.model.js';

export const startAttendenceSession = async (req, res) => {
    try {
        const facultyId = req.facultyId;
        const { subjectId, year, branch, section } = req.body;
        
        if (!subjectId || !year || !branch || !section) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        // ✅ Check if it's the faculty's scheduled period
        const { Timetable } = await import('../models/timetable.model.js');
        
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        const currentTime = now.toTimeString().slice(0, 5);

        const scheduledPeriod = await Timetable.findOne({
            facultyId,
            subjectId,
            day: currentDay,
            year,
            branch,
            section,
            startTime: { $lte: currentTime },
            endTime: { $gte: currentTime },
            isActive: true
        }).populate('subjectId', 'subjectName subjectCode');

        if (!scheduledPeriod) {
            const periodExists = await Timetable.findOne({
                facultyId,
                subjectId,
                year,
                branch,
                section,
                isActive: true
            }).populate('subjectId', 'subjectName subjectCode');

            if (periodExists) {
                return res.status(403).json({ 
                    message: `Not your scheduled period. This class is scheduled for ${periodExists.day} at ${periodExists.startTime} - ${periodExists.endTime}`,
                    scheduledTime: {
                        day: periodExists.day,
                        startTime: periodExists.startTime,
                        endTime: periodExists.endTime
                    }
                });
            } else {
                return res.status(403).json({ 
                    message: "This subject is not in your timetable for this class"
                });
            }
        }

        // Check for existing session
        const existingSession = await AttendenceAccess.findOne({
            year,
            branch,
            section,
            isActive: true
        });

        if (existingSession) {
            const Subject = (await import('../models/subject.model.js')).Subject;
            const subject = await Subject.findById(existingSession.subjectId);
            
            return res.status(400).json({ 
                message: `Attendance session already active for ${branch} Year ${year} Section ${section}`,
                activeSession: {
                    subjectName: subject?.subjectName || 'Unknown Subject',
                    subjectCode: subject?.subjectCode || existingSession.subjectId,
                    startedAt: existingSession.createdAt
                }
            });
        }

        const newSession = await AttendenceAccess.create({
            subjectId,
            facultyId,
            year,
            branch,
            section,
            isActive: true
        });
        
        const savedSession = await newSession.save();
        
        res.status(201).json({
            message: "Attendance session started successfully",
            attendenceSession: savedSession,
            period: {
                periodNumber: scheduledPeriod.periodNumber,
                startTime: scheduledPeriod.startTime,
                endTime: scheduledPeriod.endTime
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

export const checkAttendenceSession = async (req,res) => {
    try {
        const studentId = req.studentId
        const student = await Student.findById(studentId)
        // console.log(student);
        if (!student) return res.status(404).json({ message: "Student not found" })
        const attendenceSessionCheck = await AttendenceAccess.find({
            year: student.year,
            branch: student.branch,
            section: student.section,
            isActive: true
        })
        if (!attendenceSessionCheck) return res.status(404).json({ message: "No active attendence session found" })
        res.status(200).json({
            message: "Attendence session found",
            attendenceSession: attendenceSessionCheck
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

// export const markAttendence = async (req,res) => {
//     try {
//         const studentId = req.studentId
//         const subjectId = req.params.id
//         // console.log(subjectId);
//         const attendenceSessionCheck = await AttendenceAccess.findOne({
//             subjectId,
//             isActive: true
//         })
//         if (!attendenceSessionCheck) return res.status(404).json({ message: "No active attendence session found" })
//         const markStudentAttendence = await Attendence.create({
//             studentId,
//             subjectId,
//             status: "P"
//         })
//         const savedAttendence = await markStudentAttendence.save()
//         res.status(201).json({
//             message: "Attendence marked successfully",
//             attendence: savedAttendence
//         })
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: error.message })
//     }
// }

// attendence.controller.js - markAttendence function
export const markAttendence = async (req, res) => {
    try {
        const studentId = req.studentId;
        const subjectId = req.params.id;

        // Check if active session exists
        const attendenceSessionCheck = await AttendenceAccess.findOne({
            subjectId,
            isActive: true
        });
        
        if (!attendenceSessionCheck) {
            return res.status(404).json({ message: "No active attendance session found" });
        }

        // ✅ FIX: Check if already marked
        const existingAttendance = await Attendence.findOne({
            studentId,
            subjectId,
            createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
            }
        });

        if (existingAttendance) {
            return res.status(400).json({ message: "Attendance already marked for today" });
        }

        const markStudentAttendence = await Attendence.create({
            studentId,
            subjectId,
            status: "P"
        });

        const savedAttendence = await markStudentAttendence.save();
        
        res.status(201).json({
            message: "Attendance marked successfully",
            attendence: savedAttendence
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};