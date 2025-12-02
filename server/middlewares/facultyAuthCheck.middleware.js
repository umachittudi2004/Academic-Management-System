import express from "express";
import { Faculty } from "../models/faculty.model.js";

export const facultyAuthCheck = async (req,res,next) => {
    try {
        const facultyId = req?.userId
        const facultyCheck = await Faculty.findById(facultyId).select("-password")
        if (!facultyCheck) return res.status(401).json({ message: "Unauthorized buddy" })
        req.facultyId = facultyCheck._id
        next()
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}