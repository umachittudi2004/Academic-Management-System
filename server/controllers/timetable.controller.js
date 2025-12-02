import { Timetable } from "../models/timetable.model.js";
import { Subject } from "../models/subject.model.js";

export const createTimetableEntry = async (req, res) => {
    try {
        const facultyId = req.facultyId;
        const { day, periodNumber, startTime, endTime, subjectId, year, branch, section, roomNumber } = req.body;

        if (!day || !periodNumber || !startTime || !endTime || !subjectId || !year || !branch || !section) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        const existing = await Timetable.findOne({
            day,
            periodNumber,
            year,
            branch,
            section,
            isActive: true
        });

        if (existing) {
            return res.status(400).json({ 
                message: `Period ${periodNumber} on ${day} is already scheduled for ${branch} Year ${year} Section ${section}` 
            });
        }

        const entry = await Timetable.create({
            day,
            periodNumber,
            startTime,
            endTime,
            subjectId,
            facultyId,
            year,
            branch,
            section,
            roomNumber
        });

        const populated = await Timetable.findById(entry._id)
            .populate('subjectId', 'subjectName subjectCode')
            .populate('facultyId', 'name empId');

        res.status(201).json({
            message: "Timetable entry created successfully",
            entry: populated
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

export const getFacultyTimetable = async (req, res) => {
    try {
        const facultyId = req.facultyId;

        const timetable = await Timetable.find({
            facultyId,
            isActive: true
        })
        .populate('subjectId', 'subjectName subjectCode')
        .sort({ day: 1, periodNumber: 1 });

        const grouped = timetable.reduce((acc, entry) => {
            if (!acc[entry.day]) acc[entry.day] = [];
            acc[entry.day].push(entry);
            return acc;
        }, {});

        res.status(200).json({
            message: "Timetable fetched successfully",
            timetable: grouped
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

export const getCurrentPeriod = async (req, res) => {
    try {
        const facultyId = req.facultyId;
        
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        const currentTime = now.toTimeString().slice(0, 5);

        const currentPeriod = await Timetable.findOne({
            facultyId,
            day: currentDay,
            startTime: { $lte: currentTime },
            endTime: { $gte: currentTime },
            isActive: true
        })
        .populate('subjectId', 'subjectName subjectCode');

        const nextPeriod = await Timetable.findOne({
            facultyId,
            day: currentDay,
            startTime: { $gt: currentTime },
            isActive: true
        })
        .populate('subjectId', 'subjectName subjectCode')
        .sort({ startTime: 1 });

        res.status(200).json({
            message: "Current period fetched",
            currentPeriod: currentPeriod || null,
            nextPeriod: nextPeriod || null,
            currentDay,
            currentTime
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteTimetableEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyId = req.facultyId;

        const entry = await Timetable.findOne({ _id: id, facultyId });
        
        if (!entry) {
            return res.status(404).json({ message: "Timetable entry not found" });
        }

        await Timetable.findByIdAndDelete(id);

        res.status(200).json({ message: "Timetable entry deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Get student's timetable based on their year/branch/section
export const getStudentTimetable = async (req, res) => {
    try {
        const studentId = req.studentId;
        
        // Get student details
        const { Student } = await import('../models/student.model.js');
        const student = await Student.findById(studentId).select('year branch section');
        
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const { year, branch, section } = student;

        // Fetch timetable for student's class
        const timetable = await Timetable.find({
            year,
            branch,
            section,
            isActive: true
        })
        .populate('subjectId', 'subjectName subjectCode')
        .populate('facultyId', 'name empId')
        .sort({ day: 1, periodNumber: 1 });

        // Group by day
        const grouped = timetable.reduce((acc, entry) => {
            if (!acc[entry.day]) acc[entry.day] = [];
            acc[entry.day].push(entry);
            return acc;
        }, {});

        res.status(200).json({
            message: "Timetable fetched successfully",
            timetable: grouped,
            studentInfo: {
                year: student.year,
                branch: student.branch,
                section: student.section
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};