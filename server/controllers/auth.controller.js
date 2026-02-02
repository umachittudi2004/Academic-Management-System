import express from 'express';
import bcrypt from 'bcrypt';
import { Student } from '../models/student.model.js';
import { generateToken } from '../lib/generateToken.js';
import { clearToken } from '../lib/generateToken.js';
import { Faculty } from '../models/faculty.model.js';
import { AttendenceAccess } from '../models/attendenceaccess.model.js';

export const studentLoginAuth = async (req, res) => {
    try {
        let { rollno, password } = req.body
        if (!rollno || !password) return res.status(400).json({ message: "Please fill all the fields" })
        rollno = rollno.toUpperCase();
        const passwordForNotHash = password.toUpperCase();
        const student = await Student.findOne({
            rollno: rollno,
        })
        if (!student) return res.status(404).json({ message: "Student not found" })
        if (student.isHashed) {
            console.log("Hashed password");
            const checkPassword = await bcrypt.compare(password, student.password)
            console.log(checkPassword);
            if (!checkPassword) return res.status(401).json({ message: "Invalid credentials" })
        }
        else {
            if (student.password !== passwordForNotHash) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
        }
        generateToken(student._id, res, 'student')
        res.status(200).json({ message: "Login successful", student })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const studentLogoutAuth = async (req, res) => {
    try {
        const student = await Student.findById(req.studentId);
        // console.log(student);
        const availableSession = await AttendenceAccess.find({
            isActive: true,
            year: student.year,
            branch: student.branch,
            section: student.section,
        })
        if (availableSession.length > 0) {
            return res.status(400).json({ message: "You can't logout until the active attendence sessions ends" })
        }
        clearToken(res);
        // res.clearCookie('token')
        res.status(200).json({ message: "Logout successful" })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const updateStudentDetails = async (req, res) => {
    try {
        const { studentId, role } = req
        if (role !== 'student') {
            return res.status(403).json({ message: "Access denied" });
        }
        let { password, Transport, fatherName, motherName } = req.body
        let hashPassword = ""
        if (password) {
            password = password.toUpperCase()
            const salt = await bcrypt.genSalt(10);
            hashPassword = await bcrypt.hash(password, salt);
        }
        const updateStudent = await Student.findByIdAndUpdate(studentId, {
            ...(Transport && { Transport }),
            ...(fatherName && { fatherName }),
            ...(motherName && { motherName }),
            ...(password && { password: hashPassword, isHashed: true }),
        }, { new: true })
        if (!updateStudent) return res.status(404).json({ message: "Student not found" })
        res.status(200).json({ message: "Student details updated successfully", student: updateStudent })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const checkAuth = async (req, res) => {
    try {
        const { userId, role } = req
        let user = null;
        if (role === 'student') {
            user = await Student.findById(userId).select("-password");
        } else if (role === 'faculty') {
            user = await Faculty.findById(userId).select("-password");
        }
        if (!user) return res.status(401).json({ message: "Unauthorized" })
        res.status(200).json({ message: "User authenticated", user, role })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const facultyLoginAuth = async (req, res) => {
    try {
        let { empId, password} = req.body
        if (!empId || !password) return res.status(400).json({ message: "Please fill all the fields" })
        const faculty = await Faculty.findOne({
            empId: empId,
        })
        if (!faculty) return res.status(404).json({ message: "faculty not found" })
        if (faculty.isHashed) {
            const checkPassword = await bcrypt.compare(password, faculty.password)
            if (!checkPassword) return res.status(401).json({ message: "Invalid credentials" })
        }
        else {
            if (faculty.password !== password) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
        }
        if (faculty.deviceId) {
            return res.status(403).json({ message: 'Already logged in on another device' });
        }
        generateToken(faculty._id, res, 'faculty')
        res.status(200).json({ message: "Login successful", faculty })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const facultyLogoutAuth = async (req, res) => {
    try {
        clearToken(res);
        // res.clearCookie('token')        
        res.status(200).json({ message: "Logout successful" })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const updateFacultyDetails = async (req, res) => {
    try {
        const { facultyId, role } = req
        let { password } = req.body
        if (role !== 'faculty') {
            return res.status(403).json({ message: "Access denied" });
        }
        let hashPassword = ""
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashPassword = await bcrypt.hash(password, salt);
        }
        const updatedFaculty = await Faculty.findByIdAndUpdate(facultyId, {
            ...(password && { password: hashPassword, isHashed: true }),
        }, { new: true })
        if (!updatedFaculty) return res.status(404).json({ message: "faculty not found" })
        res.status(200).json({ message: "faculty details updated successfully", faculty: updatedFaculty })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}