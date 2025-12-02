import { Notice } from '../models/notice.model.js';
import { NoticeRead } from '../models/noticeread.model.js';
import { NoticeView } from '../models/noticeview.model.js';
import { Student } from '../models/student.model.js';
import { uploadToDrive, deleteFromDrive } from '../lib/googleDrive.js';
import fs from 'fs';

// Create Notice (Faculty)
export const createNotice = async (req, res) => {
    try {
        const facultyId = req.facultyId;
        const {
            title,
            content,
            category,
            targetYear,
            targetBranch,
            targetSection,
            isUrgent,
            isPinned,
            expiryDate
        } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }

        // Process uploaded files and upload to Google Drive
        const attachments = [];
        if (req.files && req.files.length > 0) {
            console.log(`📦 Processing ${req.files.length} file(s)...`);

            for (const file of req.files) {
                console.log(`📄 Uploading: ${file.originalname}`);
                
                try {
                    // Upload to Google Drive
                    const driveFile = await uploadToDrive(
                        file.path,           // Local file path
                        file.originalname,   // Original filename
                        file.mimetype,       // MIME type
                        'Notices'           // Folder name
                    );

                    attachments.push({
                        fileName: file.originalname,
                        googleDriveFileId: driveFile.fileId,
                        googleDriveLink: driveFile.webViewLink,
                        downloadLink: driveFile.webContentLink,
                        mimeType: file.mimetype,
                        size: driveFile.bytes || file.size,
                        uploadedAt: new Date()
                    });

                    // Delete local temp file after successful upload
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
                    // Continue with other files
                }
            }

            console.log(`✅ Successfully uploaded ${attachments.length} file(s)`);
        }

        // Parse arrays from request
        const parsedTargetYear = targetYear ? JSON.parse(targetYear) : [];
        const parsedTargetBranch = targetBranch ? JSON.parse(targetBranch) : [];
        const parsedTargetSection = targetSection ? JSON.parse(targetSection) : [];

        // Create notice
        const notice = await Notice.create({
            title,
            content,
            category,
            postedBy: facultyId,
            targetYear: parsedTargetYear,
            targetBranch: parsedTargetBranch,
            targetSection: parsedTargetSection,
            attachments,
            isUrgent: isUrgent === 'true',
            isPinned: isPinned === 'true',
            expiryDate: expiryDate || null
        });

        const savedNotice = await notice.save();

        res.status(201).json({
            message: "Notice created successfully",
            notice: savedNotice
        });
    } catch (error) {
        console.error('❌ Create notice error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Faculty's Notices
export const getFacultyNotices = async (req, res) => {
    try {
        const facultyId = req.facultyId;
        
        const notices = await Notice.find({ postedBy: facultyId })
            .sort({ isPinned: -1, createdAt: -1 })
            .lean();

        // Get read count and unique reader count for each notice
        const noticesWithStats = await Promise.all(
            notices.map(async (notice) => {
                const readCount = await NoticeRead.countDocuments({ noticeId: notice._id });
                const uniqueReaderCount = await NoticeView.countDocuments({ noticeId: notice._id });
                
                return { 
                    ...notice, 
                    readCount,
                    uniqueReaderCount
                };
            })
        );

        res.status(200).json({
            message: "Notices fetched successfully",
            notices: noticesWithStats
        });
    } catch (error) {
        console.error('❌ Get faculty notices error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Student Notices (filtered by their year/branch/section)
export const getStudentNotices = async (req, res) => {
    try {
        const studentId = req.studentId;
        
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const currentDate = new Date();

        // Find notices targeted to this student
        const notices = await Notice.find({
            $and: [
                { publishDate: { $lte: currentDate } },
                {
                    $or: [
                        { expiryDate: null },
                        { expiryDate: { $gt: currentDate } }
                    ]
                },
                {
                    $or: [
                        { targetYear: [] },
                        { targetYear: student.year }
                    ]
                },
                {
                    $or: [
                        { targetBranch: [] },
                        { targetBranch: student.branch }
                    ]
                },
                {
                    $or: [
                        { targetSection: [] },
                        { targetSection: student.section }
                    ]
                }
            ]
        })
        .populate('postedBy', 'name empId')
        .sort({ isPinned: -1, isUrgent: -1, createdAt: -1 })
        .lean();

        // Check which notices are read by this student
        const readNotices = await NoticeRead.find({
            studentId,
            noticeId: { $in: notices.map(n => n._id) }
        }).lean();

        const readNoticeIds = new Set(readNotices.map(rn => rn.noticeId.toString()));

        const noticesWithReadStatus = notices.map(notice => ({
            ...notice,
            isRead: readNoticeIds.has(notice._id.toString())
        }));

        res.status(200).json({
            message: "Notices fetched successfully",
            notices: noticesWithReadStatus
        });
    } catch (error) {
        console.error('❌ Get student notices error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Single Notice Details & Track View
export const getNoticeById = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.studentId;

        const notice = await Notice.findById(id)
            .populate('postedBy', 'name empId');

        if (!notice) {
            return res.status(404).json({ message: "Notice not found" });
        }

        // Increment total view count
        notice.viewCount += 1;
        await notice.save();

        // Track unique student view
        if (studentId) {
            try {
                const existingView = await NoticeView.findOne({
                    noticeId: id,
                    studentId
                });

                if (existingView) {
                    existingView.viewCount += 1;
                    existingView.lastViewedAt = new Date();
                    await existingView.save();
                } else {
                    await NoticeView.create({
                        noticeId: id,
                        studentId
                    });
                }
            } catch (error) {
                if (error.code !== 11000) {
                    console.error('Error tracking view:', error);
                }
            }
        }

        res.status(200).json({
            message: "Notice fetched successfully",
            notice
        });
    } catch (error) {
        console.error('❌ Get notice by ID error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Mark Notice as Read (Student)
export const markNoticeAsRead = async (req, res) => {
    try {
        const studentId = req.studentId;
        const { id } = req.params;

        const existingRead = await NoticeRead.findOne({
            noticeId: id,
            studentId
        });

        if (existingRead) {
            return res.status(200).json({ message: "Already marked as read" });
        }

        await NoticeRead.create({
            noticeId: id,
            studentId
        });

        res.status(200).json({ message: "Marked as read" });
    } catch (error) {
        console.error('❌ Mark as read error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Unread Count (Student)
export const getUnreadCount = async (req, res) => {
    try {
        const studentId = req.studentId;
        
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const currentDate = new Date();

        const allNotices = await Notice.find({
            $and: [
                { publishDate: { $lte: currentDate } },
                {
                    $or: [
                        { expiryDate: null },
                        { expiryDate: { $gt: currentDate } }
                    ]
                },
                {
                    $or: [
                        { targetYear: [] },
                        { targetYear: student.year }
                    ]
                },
                {
                    $or: [
                        { targetBranch: [] },
                        { targetBranch: student.branch }
                    ]
                },
                {
                    $or: [
                        { targetSection: [] },
                        { targetSection: student.section }
                    ]
                }
            ]
        }).select('_id');

        const totalNotices = allNotices.length;

        const readCount = await NoticeRead.countDocuments({
            studentId,
            noticeId: { $in: allNotices.map(n => n._id) }
        });

        const unreadCount = totalNotices - readCount;

        res.status(200).json({
            message: "Unread count fetched",
            unreadCount,
            totalNotices
        });
    } catch (error) {
        console.error('❌ Get unread count error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update Notice (Faculty)
export const updateNotice = async (req, res) => {
    try {
        const facultyId = req.facultyId;
        const { id } = req.params;
        const updateData = req.body;

        const notice = await Notice.findOne({ _id: id, postedBy: facultyId });
        
        if (!notice) {
            return res.status(404).json({ message: "Notice not found or unauthorized" });
        }

        // Parse arrays if they exist
        if (updateData.targetYear) updateData.targetYear = JSON.parse(updateData.targetYear);
        if (updateData.targetBranch) updateData.targetBranch = JSON.parse(updateData.targetBranch);
        if (updateData.targetSection) updateData.targetSection = JSON.parse(updateData.targetSection);

        const updatedNotice = await Notice.findByIdAndUpdate(id, updateData, { new: true });

        res.status(200).json({
            message: "Notice updated successfully",
            notice: updatedNotice
        });
    } catch (error) {
        console.error('❌ Update notice error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete Notice (Faculty)
export const deleteNotice = async (req, res) => {
    try {
        const facultyId = req.facultyId;
        const { id } = req.params;

        const notice = await Notice.findOne({ _id: id, postedBy: facultyId });
        
        if (!notice) {
            return res.status(404).json({ message: "Notice not found or unauthorized" });
        }

        // Delete files from Google Drive
        if (notice.attachments && notice.attachments.length > 0) {
            console.log(`🗑️ Deleting ${notice.attachments.length} file(s) from Google Drive...`);
            
            for (const file of notice.attachments) {
                try {
                    await deleteFromDrive(file.googleDriveFileId);
                } catch (error) {
                    console.error(`❌ Failed to delete ${file.fileName}:`, error.message);
                    // Continue deletion even if Drive delete fails
                }
            }
        }

        // Delete associated reads and views
        await NoticeRead.deleteMany({ noticeId: id });
        await NoticeView.deleteMany({ noticeId: id });

        // Delete notice
        await Notice.findByIdAndDelete(id);

        res.status(200).json({ message: "Notice deleted successfully" });
    } catch (error) {
        console.error('❌ Delete notice error:', error);
        res.status(500).json({ message: error.message });
    }
};