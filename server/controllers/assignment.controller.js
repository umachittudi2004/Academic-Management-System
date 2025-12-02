import { Assignment } from "../models/assignment.model.js";
import { Submission } from "../models/submission.model.js";
import { Grade } from "../models/grade.model.js";
import { Subject } from "../models/subject.model.js";
import { Student } from "../models/student.model.js";
import { uploadToDrive, deleteFromDrive } from '../lib/googleDrive.js';
import fs from 'fs';

// ========== FACULTY CONTROLLERS ==========

// Create Assignment
export const createAssignment = async (req, res) => {
    try {
        const facultyId = req.facultyId;
        const {
            title,
            description,
            subjectId,
            year,
            branch,
            section,
            totalMarks,
            dueDate
        } = req.body;

        // Validate required fields
        if (!title || !description || !subjectId || !year || !branch || !section || !totalMarks || !dueDate) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        // Verify subject belongs to faculty
        const subject = await Subject.findOne({ _id: subjectId, faculty: facultyId });
        if (!subject) {
            return res.status(403).json({ message: "You can only create assignments for your subjects" });
        }

        // Validate due date is in future
        if (new Date(dueDate) <= new Date()) {
            return res.status(400).json({ message: "Due date must be in the future" });
        }

        // Process uploaded files (same as Notice)
        const processedAttachments = [];
        if (req.files && req.files.length > 0) {
            console.log(`📦 Processing ${req.files.length} file(s)...`);

            for (const file of req.files) {
                console.log(`📄 Uploading: ${file.originalname}`);
                
                try {
                    // Upload to Google Drive
                    const driveFile = await uploadToDrive(
                        file.path,
                        file.originalname,
                        file.mimetype,
                        'Assignments/Problem_Statements'
                    );

                    processedAttachments.push({
                        fileName: file.originalname,
                        googleDriveLink: driveFile.webViewLink,
                        fileId: driveFile.fileId,
                        mimeType: file.mimetype,
                        size: driveFile.bytes || file.size
                    });

                    // Delete temp file after successful upload
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                        console.log(`🗑️ Deleted temp file: ${file.filename}`);
                    }
                } catch (uploadError) {
                    console.error(`❌ Upload failed for ${file.originalname}:`, uploadError.message);
                    
                    // Clean up local file even if upload fails
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                }
            }

            console.log(`✅ Successfully uploaded ${processedAttachments.length} file(s)`);
        }

        // Create assignment
        const assignment = await Assignment.create({
            title,
            description,
            subjectId,
            facultyId,
            year,
            branch,
            section,
            totalMarks,
            dueDate,
            attachments: processedAttachments
        });

        const populated = await Assignment.findById(assignment._id)
            .populate('subjectId', 'subjectName subjectCode')
            .populate('facultyId', 'name empId');

        res.status(201).json({
            message: "Assignment created successfully",
            assignment: populated
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Get Faculty's Assignments
export const getFacultyAssignments = async (req, res) => {
    try {
        const facultyId = req.facultyId;

        const assignments = await Assignment.find({
            facultyId,
            isActive: true
        })
            .populate('subjectId', 'subjectName subjectCode')
            .sort({ createdAt: -1 });

        // Get submission count for each assignment
        const assignmentsWithStats = await Promise.all(
            assignments.map(async (assignment) => {
                const totalSubmissions = await Submission.countDocuments({
                    assignmentId: assignment._id
                });
                const gradedSubmissions = await Submission.countDocuments({
                    assignmentId: assignment._id,
                    status: 'graded'
                });

                // Get target student count
                const targetStudents = await Student.countDocuments({
                    year: assignment.year,
                    branch: assignment.branch,
                    section: assignment.section
                });

                return {
                    ...assignment.toObject(),
                    stats: {
                        totalSubmissions,
                        gradedSubmissions,
                        pendingGrading: totalSubmissions - gradedSubmissions,
                        targetStudents,
                        submissionRate: targetStudents > 0
                            ? ((totalSubmissions / targetStudents) * 100).toFixed(1)
                            : 0
                    }
                };
            })
        );

        res.status(200).json({
            message: "Assignments fetched successfully",
            assignments: assignmentsWithStats
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Get Assignment Details
export const getAssignmentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.facultyId ? 'faculty' : 'student';

        const assignment = await Assignment.findById(id)
            .populate('subjectId', 'subjectName subjectCode')
            .populate('facultyId', 'name empId');

        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        // Faculty can see all assignments
        // Students can only see their class assignments
        if (userRole === 'student') {
            const student = await Student.findById(req.studentId);
            if (!student) {
                return res.status(404).json({ message: "Student not found" });
            }

            if (assignment.year !== student.year ||
                assignment.branch !== student.branch ||
                assignment.section !== student.section) {
                return res.status(403).json({ message: "Access denied" });
            }
        }

        res.status(200).json({
            message: "Assignment details fetched",
            assignment
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Update Assignment
export const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyId = req.facultyId;
        const updates = req.body;

        // Find assignment and verify ownership
        const assignment = await Assignment.findOne({ _id: id, facultyId });
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found or access denied" });
        }

        // Update assignment
        const updated = await Assignment.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate('subjectId', 'subjectName subjectCode');

        res.status(200).json({
            message: "Assignment updated successfully",
            assignment: updated
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Delete Assignment (Soft Delete)
export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyId = req.facultyId;

        const assignment = await Assignment.findOne({ _id: id, facultyId });
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found or access denied" });
        }

        // Delete files from Google Drive
        if (assignment.attachments && assignment.attachments.length > 0) {
            console.log(`🗑️ Deleting ${assignment.attachments.length} file(s) from Google Drive...`);
            
            for (const file of assignment.attachments) {
                try {
                    await deleteFromDrive(file.fileId);
                    console.log(`✅ Deleted: ${file.fileName}`);
                } catch (error) {
                    console.error(`❌ Failed to delete ${file.fileName}:`, error.message);
                }
            }
        }

        // Soft delete
        await Assignment.findByIdAndUpdate(id, { isActive: false });

        res.status(200).json({ message: "Assignment deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Get Assignment Submissions (Faculty View)
export const getAssignmentSubmissions = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyId = req.facultyId;

        // Verify assignment belongs to faculty
        const assignment = await Assignment.findOne({ _id: id, facultyId });
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found or access denied" });
        }

        // Get all submissions
        const submissions = await Submission.find({ assignmentId: id })
            .populate('studentId', 'rollno name branch section year')
            .sort({ submittedAt: -1 });

        // Get grades for submissions
        const submissionsWithGrades = await Promise.all(
            submissions.map(async (submission) => {
                const grade = await Grade.findOne({ submissionId: submission._id });
                return {
                    ...submission.toObject(),
                    grade: grade || null
                };
            })
        );

        res.status(200).json({
            message: "Submissions fetched successfully",
            submissions: submissionsWithGrades,
            totalSubmissions: submissions.length
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Grade Submission
export const gradeSubmission = async (req, res) => {
    try {
        const facultyId = req.facultyId;
        const { submissionId, marksObtained, feedback } = req.body;

        if (!submissionId || marksObtained === undefined) {
            return res.status(400).json({ message: "Submission ID and marks are required" });
        }

        // Get submission
        const submission = await Submission.findById(submissionId)
            .populate('assignmentId');

        if (!submission) {
            return res.status(404).json({ message: "Submission not found" });
        }

        // Verify assignment belongs to faculty
        if (submission.assignmentId.facultyId.toString() !== facultyId.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Validate marks
        if (marksObtained < 0 || marksObtained > submission.assignmentId.totalMarks) {
            return res.status(400).json({
                message: `Marks must be between 0 and ${submission.assignmentId.totalMarks}`
            });
        }

        // Check if already graded
        let grade = await Grade.findOne({ submissionId });

        if (grade) {
            // Update existing grade
            grade.marksObtained = marksObtained;
            grade.totalMarks = submission.assignmentId.totalMarks;
            grade.feedback = feedback || "";
            grade.gradedBy = facultyId;
            grade.gradedAt = new Date();
            await grade.save();
        } else {
            // Create new grade
            grade = await Grade.create({
                submissionId,
                assignmentId: submission.assignmentId._id,
                studentId: submission.studentId,
                marksObtained,
                totalMarks: submission.assignmentId.totalMarks,
                feedback: feedback || "",
                gradedBy: facultyId
            });
        }

        // Update submission status
        await Submission.findByIdAndUpdate(submissionId, { status: 'graded' });

        const populatedGrade = await Grade.findById(grade._id)
            .populate('studentId', 'rollno name')
            .populate('gradedBy', 'name empId');

        res.status(200).json({
            message: "Submission graded successfully",
            grade: populatedGrade
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Get Assignment Statistics
export const getAssignmentStats = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyId = req.facultyId;

        const assignment = await Assignment.findOne({ _id: id, facultyId });
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found or access denied" });
        }

        // Target students
        const targetStudents = await Student.countDocuments({
            year: assignment.year,
            branch: assignment.branch,
            section: assignment.section
        });

        // Submissions
        const totalSubmissions = await Submission.countDocuments({ assignmentId: id });
        const onTimeSubmissions = await Submission.countDocuments({
            assignmentId: id,
            isLate: false
        });
        const lateSubmissions = await Submission.countDocuments({
            assignmentId: id,
            isLate: true
        });

        // Grading
        const gradedSubmissions = await Submission.countDocuments({
            assignmentId: id,
            status: 'graded'
        });

        // Grade statistics
        const grades = await Grade.find({ assignmentId: id });
        const totalMarks = grades.reduce((sum, g) => sum + g.marksObtained, 0);
        const averageMarks = grades.length > 0 ? (totalMarks / grades.length).toFixed(2) : 0;

        const sortedGrades = grades.map(g => g.marksObtained).sort((a, b) => b - a);
        const highestMarks = sortedGrades.length > 0 ? sortedGrades[0] : 0;
        const lowestMarks = sortedGrades.length > 0 ? sortedGrades[sortedGrades.length - 1] : 0;

        // Grade distribution
        const gradeDistribution = {
            "90-100": grades.filter(g => g.marksObtained >= 90).length,
            "80-89": grades.filter(g => g.marksObtained >= 80 && g.marksObtained < 90).length,
            "70-79": grades.filter(g => g.marksObtained >= 70 && g.marksObtained < 80).length,
            "60-69": grades.filter(g => g.marksObtained >= 60 && g.marksObtained < 70).length,
            "Below 60": grades.filter(g => g.marksObtained < 60).length
        };

        res.status(200).json({
            message: "Statistics fetched successfully",
            stats: {
                targetStudents,
                totalSubmissions,
                pendingSubmissions: targetStudents - totalSubmissions,
                submissionRate: targetStudents > 0
                    ? ((totalSubmissions / targetStudents) * 100).toFixed(1)
                    : 0,
                onTimeSubmissions,
                lateSubmissions,
                lateRate: totalSubmissions > 0
                    ? ((lateSubmissions / totalSubmissions) * 100).toFixed(1)
                    : 0,
                gradedSubmissions,
                ungradedSubmissions: totalSubmissions - gradedSubmissions,
                averageMarks,
                highestMarks,
                lowestMarks,
                gradeDistribution
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// ========== STUDENT CONTROLLERS ==========

// Get Student's Assignments
export const getStudentAssignments = async (req, res) => {
    try {
        const studentId = req.studentId;

        // Get student details
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Get assignments for student's class
        const assignments = await Assignment.find({
            year: student.year,
            branch: student.branch,
            section: student.section,
            isActive: true
        })
            .populate('subjectId', 'subjectName subjectCode')
            .populate('facultyId', 'name empId')
            .sort({ dueDate: 1 });

        // Check submission and grade status for each assignment
        const assignmentsWithStatus = await Promise.all(
            assignments.map(async (assignment) => {
                const submission = await Submission.findOne({
                    assignmentId: assignment._id,
                    studentId
                });

                let grade = null;
                if (submission) {
                    grade = await Grade.findOne({ submissionId: submission._id });
                }

                // Calculate time remaining
                const now = new Date();
                const due = new Date(assignment.dueDate);
                const timeDiff = due - now;
                const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
                const daysRemaining = Math.floor(hoursRemaining / 24);

                let urgency = 'normal';
                if (timeDiff < 0) {
                    urgency = 'overdue';
                } else if (hoursRemaining < 24) {
                    urgency = 'urgent';
                } else if (daysRemaining < 3) {
                    urgency = 'upcoming';
                }

                return {
                    ...assignment.toObject(),
                    submission: submission || null,
                    grade: grade || null,
                    status: grade ? 'graded' : (submission ? 'submitted' : 'pending'),
                    timeRemaining: {
                        days: Math.max(0, daysRemaining),
                        hours: Math.max(0, hoursRemaining % 24),
                        urgency
                    }
                };
            })
        );

        res.status(200).json({
            message: "Assignments fetched successfully",
            assignments: assignmentsWithStatus
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Submit Assignment
export const submitAssignment = async (req, res) => {
    try {
        const studentId = req.studentId;
        const { assignmentId, remarks } = req.body;

        if (!assignmentId) {
            return res.status(400).json({ message: "Assignment ID is required" });
        }

        // Get assignment
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment || !assignment.isActive) {
            return res.status(404).json({ message: "Assignment not found or inactive" });
        }

        // Verify student is in target class
        const student = await Student.findById(studentId);
        if (assignment.year !== student.year ||
            assignment.branch !== student.branch ||
            assignment.section !== student.section) {
            return res.status(403).json({ message: "This assignment is not for your class" });
        }

        // Process uploaded files
        const processedFiles = [];
        if (req.files && req.files.length > 0) {
            console.log(`📦 Processing ${req.files.length} student file(s)...`);

            for (const file of req.files) {
                console.log(`📄 Uploading: ${file.originalname}`);
                
                try {
                    const driveFile = await uploadToDrive(
                        file.path,
                        `${student.rollno}_${file.originalname}`,
                        file.mimetype,
                        `Assignments/Submissions/Year${student.year}_${student.branch}_${student.section}`
                    );

                    processedFiles.push({
                        fileName: file.originalname,
                        googleDriveLink: driveFile.webViewLink,
                        fileId: driveFile.fileId,
                        mimeType: file.mimetype,
                        size: driveFile.bytes || file.size
                    });

                    // Delete temp file
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (uploadError) {
                    console.error(`❌ Upload failed for ${file.originalname}:`, uploadError.message);
                    
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                }
            }
        }

        if (processedFiles.length === 0) {
            return res.status(400).json({ message: "At least one file is required" });
        }

        // Check if deadline passed
        const now = new Date();
        const isLate = now > new Date(assignment.dueDate);

        // Check if already submitted
        const existingSubmission = await Submission.findOne({ assignmentId, studentId });

        if (existingSubmission) {
            // Delete old files from Drive
            if (existingSubmission.submittedFiles && existingSubmission.submittedFiles.length > 0) {
                for (const file of existingSubmission.submittedFiles) {
                    try {
                        await deleteFromDrive(file.fileId);
                    } catch (error) {
                        console.error(`Failed to delete old file: ${file.fileName}`);
                    }
                }
            }

            // Update existing submission
            existingSubmission.submittedFiles = processedFiles;
            existingSubmission.submittedAt = now;
            existingSubmission.isLate = isLate;
            existingSubmission.remarks = remarks || "";
            existingSubmission.status = 'submitted';
            await existingSubmission.save();

            // Delete old grade if exists
            await Grade.deleteOne({ submissionId: existingSubmission._id });

            return res.status(200).json({
                message: isLate
                    ? "Resubmitted successfully (Late submission)"
                    : "Resubmitted successfully",
                submission: existingSubmission,
                isLate
            });
        }

        // Create new submission
        const submission = await Submission.create({
            assignmentId,
            studentId,
            submittedFiles: processedFiles,
            submittedAt: now,
            isLate,
            remarks: remarks || ""
        });

        res.status(201).json({
            message: isLate
                ? "Assignment submitted (Late submission)"
                : "Assignment submitted successfully",
            submission,
            isLate
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Get Student's Own Submission
export const getMySubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.studentId;

        const submission = await Submission.findOne({
            assignmentId: id,
            studentId
        }).populate('assignmentId', 'title totalMarks dueDate');

        if (!submission) {
            return res.status(404).json({ message: "No submission found" });
        }

        const grade = await Grade.findOne({ submissionId: submission._id })
            .populate('gradedBy', 'name empId');

        res.status(200).json({
            message: "Submission fetched successfully",
            submission,
            grade: grade || null
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Get Student's Grade for Assignment
export const getMyGrade = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.studentId;

        const submission = await Submission.findOne({
            assignmentId: id,
            studentId
        });

        if (!submission) {
            return res.status(404).json({ message: "No submission found" });
        }

        const grade = await Grade.findOne({ submissionId: submission._id })
            .populate('assignmentId', 'title totalMarks')
            .populate('gradedBy', 'name empId');

        if (!grade) {
            return res.status(404).json({ message: "Not graded yet" });
        }

        res.status(200).json({
            message: "Grade fetched successfully",
            grade,
            submission: {
                submittedAt: submission.submittedAt,
                isLate: submission.isLate,
                files: submission.submittedFiles
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};