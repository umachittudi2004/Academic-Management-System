import express from 'express';
import { Subject } from '../models/subject.model.js';
import { Faculty } from '../models/faculty.model.js';
import { Student } from '../models/student.model.js';

export const createSubject = async (req, res) => {
    try {
        const facultyId = req.facultyId;
        const { subjectName, subjectCode, year, section, branch } = req.body;
        if (!subjectName || !subjectCode || !year || !section || !branch) return res.status(400).json({ message: "Please fill all the fields" })
        const subject = await Subject.create({
            subjectName,
            subjectCode,
            year,
            section,
            branch,
            faculty: facultyId
        })
        const newSubject = await subject.save()
        await Faculty.findByIdAndUpdate(facultyId, {
            $push: { subjects: subject._id }
        })
        res.status(201).json({
            message: "Subject created successfully",
            subject: newSubject
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const getSubjectById = async (req,res) => {
    try {
        // Fix: Get IDs from path parameter as comma-separated list
        const subjectIds = req.params.ids.split(',');
        if (!subjectIds || subjectIds.length === 0) 
            return res.status(400).json({ message: "Please provide at least one subject ID" })
        
        const subject = await Subject.find({ _id: { $in: subjectIds } })
        if (!subject || subject.length === 0) 
            return res.status(404).json({ message: "Subjects not found" })
        
        res.status(200).json({
            message: "Subject fetched successfully",
            subject
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({}).populate("faculty", "name empId -_id").sort({ createdAt: -1 })
        res.status(200).json({
            message: "Subjects fetched successfully",
            subjects
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const getSubjectsByFaculty = async (req,res) => {
    try {
        const facultyId = req.facultyId;
        const subjects = await Faculty.findById(facultyId).populate("subjects");
        res.status(200).json({
            message: "Subjects fetched successfully",
            subjects: subjects.subjects
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const getSubjectByYearBranchSection = async (req,res) => {
    try {
        const student = req.studentId;
        // console.log(student);
        const studentDetails = await Student.findById(student);
        if(!studentDetails) return res.status(404).json({message: "Student not found"});
        console.log(studentDetails);
        const subjects = await Subject.find({
            year: studentDetails.year,
            branch: studentDetails.branch,
            section: studentDetails.section
        }).populate("faculty", "name empId -_id");
        // console.log(subjects);
        res.status(200).json({
            message: "Subjects fetched successfully",
            subjects
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}