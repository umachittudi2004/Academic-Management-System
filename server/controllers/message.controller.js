import { Message } from "../models/message.model.js";
import { Conversation } from "../models/conversation.model.js";
import { MessageNotification } from "../models/messageNotification.model.js";
import { Student } from "../models/student.model.js";
import { Faculty } from "../models/faculty.model.js";
import { uploadToDrive, deleteFromDrive } from '../lib/googleDrive.js';
import fs from 'fs';

// ========== SEND MESSAGE ==========
export const sendMessage = async (req, res) => {
    try {
        const { userId, role } = req; // From auth middleware
        const { 
            recipientId, 
            recipientType, 
            subject, 
            content, 
            priority = 'normal' 
        } = req.body;

        if (!recipientId || !recipientType || !subject || !content) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Get sender info
        let sender;
        if (role === 'student') {
            sender = await Student.findById(userId);
        } else {
            sender = await Faculty.findById(userId);
        }

        if (!sender) {
            return res.status(404).json({ message: "Sender not found" });
        }

        // Get recipient info
        let recipient;
        if (recipientType === 'Student') {
            recipient = await Student.findById(recipientId);
        } else if (recipientType === 'Faculty') {
            recipient = await Faculty.findById(recipientId);
        }

        if (!recipient) {
            return res.status(404).json({ message: "Recipient not found" });
        }

        // Process file attachments
        const processedAttachments = [];
        if (req.files && req.files.length > 0) {
            console.log(`📦 Processing ${req.files.length} attachment(s)...`);

            for (const file of req.files) {
                try {
                    const driveFile = await uploadToDrive(
                        file.path,
                        file.originalname,
                        file.mimetype,
                        'Messages/Attachments'
                    );

                    processedAttachments.push({
                        fileName: file.originalname,
                        googleDriveLink: driveFile.webViewLink,
                        fileId: driveFile.fileId,
                        mimeType: file.mimetype,
                        size: driveFile.bytes || file.size
                    });

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

        // Create or find conversation thread
        let conversation = await Conversation.findOne({
            'participants.userId': { $all: [userId, recipientId] },
            type: 'direct'
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [
                    {
                        userId: userId,
                        userType: role === 'student' ? 'Student' : 'Faculty',
                        userName: sender.name
                    },
                    {
                        userId: recipientId,
                        userType: recipientType,
                        userName: recipient.name
                    }
                ],
                type: 'direct',
                unreadCount: new Map([
                    [userId.toString(), 0],
                    [recipientId.toString(), 0]
                ])
            });
        }

        // Create message
        const message = await Message.create({
            senderId: userId,
            senderType: role === 'student' ? 'Student' : 'Faculty',
            senderName: sender.name,
            recipientId,
            recipientType,
            recipientName: recipient.name,
            subject,
            content,
            attachments: processedAttachments,
            priority,
            threadId: conversation._id,
            isBroadcast: false
        });

        // Update conversation
        conversation.lastMessage = {
            content: content.substring(0, 100),
            sentAt: new Date(),
            senderId: userId
        };
        
        // Increment unread count for recipient
        const unreadMap = conversation.unreadCount;
        const currentCount = unreadMap.get(recipientId.toString()) || 0;
        unreadMap.set(recipientId.toString(), currentCount + 1);
        conversation.unreadCount = unreadMap;
        
        conversation.updatedAt = new Date();
        await conversation.save();

        // Create notification for recipient
        await MessageNotification.create({
            userId: recipientId,
            userType: recipientType,
            messageId: message._id,
            title: `New message from ${sender.name}`,
            body: content.substring(0, 100),
            senderName: sender.name,
            senderType: role === 'student' ? 'Student' : 'Faculty'
        });

        // Emit socket event (handled by socket.io)
        const io = req.app.get('io');
        if (io) {
            io.to(recipientId.toString()).emit('new_message', {
                messageId: message._id,
                senderId: userId,
                senderName: sender.name,
                subject,
                content: content.substring(0, 100),
                threadId: conversation._id,
                createdAt: message.createdAt
            });
        }

        res.status(201).json({
            message: "Message sent successfully",
            data: message
        });
    } catch (error) {
        console.error('❌ Send message error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== BROADCAST MESSAGE (Faculty only) ==========
export const broadcastMessage = async (req, res) => {
    try {
        const facultyId = req.facultyId;
        const { 
            year, 
            branch, 
            section, 
            subject, 
            content, 
            priority = 'normal' 
        } = req.body;

        if (!year || !branch || !section || !subject || !content) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const faculty = await Faculty.findById(facultyId);
        if (!faculty) {
            return res.status(404).json({ message: "Faculty not found" });
        }

        // Get all students in the class
        const students = await Student.find({
            year: parseInt(year),
            branch,
            section
        });

        if (students.length === 0) {
            return res.status(404).json({ message: "No students found in this class" });
        }

        // Process file attachments
        const processedAttachments = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const driveFile = await uploadToDrive(
                        file.path,
                        file.originalname,
                        file.mimetype,
                        'Messages/Broadcast'
                    );

                    processedAttachments.push({
                        fileName: file.originalname,
                        googleDriveLink: driveFile.webViewLink,
                        fileId: driveFile.fileId,
                        mimeType: file.mimetype,
                        size: driveFile.bytes || file.size
                    });

                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (uploadError) {
                    console.error(`Upload error:`, uploadError);
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                }
            }
        }

        // Create broadcast message
        const message = await Message.create({
            senderId: facultyId,
            senderType: 'Faculty',
            senderName: faculty.name,
            recipientType: 'Class',
            recipientName: `Year ${year} ${branch} Section ${section}`,
            subject,
            content,
            attachments: processedAttachments,
            priority,
            isBroadcast: true,
            broadcastTo: { year: parseInt(year), branch, section }
        });

        // Create notifications for all students
        const notifications = students.map(student => ({
            userId: student._id,
            userType: 'Student',
            messageId: message._id,
            title: `Class Announcement from ${faculty.name}`,
            body: content.substring(0, 100),
            senderName: faculty.name,
            senderType: 'Faculty'
        }));

        await MessageNotification.insertMany(notifications);

        // Emit socket event to all students
        const io = req.app.get('io');
        if (io) {
            students.forEach(student => {
                io.to(student._id.toString()).emit('new_broadcast', {
                    messageId: message._id,
                    senderName: faculty.name,
                    subject,
                    content: content.substring(0, 100),
                    priority,
                    createdAt: message.createdAt
                });
            });
        }

        res.status(201).json({
            message: `Broadcast sent to ${students.length} students`,
            data: message,
            recipientCount: students.length
        });
    } catch (error) {
        console.error('❌ Broadcast error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== GET INBOX ==========
export const getInbox = async (req, res) => {
    try {
        const { userId, role } = req;
        const { filter = 'all' } = req.query; // all, unread, archived

        let query = {
            recipientId: userId,
            isDeleted: false
        };

        // Add broadcast messages for students
        if (role === 'student') {
            const student = await Student.findById(userId);
            query = {
                $or: [
                    { recipientId: userId, isDeleted: false },
                    { 
                        isBroadcast: true, 
                        'broadcastTo.year': student.year,
                        'broadcastTo.branch': student.branch,
                        'broadcastTo.section': student.section,
                        isDeleted: false
                    }
                ]
            };
        }

        if (filter === 'unread') {
            query.isRead = false;
        } else if (filter === 'archived') {
            query.isArchived = true;
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        res.status(200).json({
            message: "Inbox fetched successfully",
            messages,
            count: messages.length
        });
    } catch (error) {
        console.error('❌ Get inbox error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== GET SENT MESSAGES ==========
export const getSentMessages = async (req, res) => {
    try {
        const { userId } = req;

        const messages = await Message.find({
            senderId: userId,
            isDeleted: false
        })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

        res.status(200).json({
            message: "Sent messages fetched successfully",
            messages,
            count: messages.length
        });
    } catch (error) {
        console.error('❌ Get sent error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== GET CONVERSATION THREAD ==========
export const getThread = async (req, res) => {
    try {
        const { threadId } = req.params;
        const { userId } = req;

        const conversation = await Conversation.findById(threadId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // Verify user is part of conversation
        const isParticipant = conversation.participants.some(
            p => p.userId.toString() === userId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "Access denied" });
        }

        const messages = await Message.find({
            threadId,
            isDeleted: false
        })
        .sort({ createdAt: 1 })
        .lean();

        res.status(200).json({
            message: "Thread fetched successfully",
            conversation,
            messages
        });
    } catch (error) {
        console.error('❌ Get thread error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== MARK AS READ ==========
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req;

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Verify user is recipient
        if (message.recipientId && message.recipientId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Update message
        message.isRead = true;
        message.readAt = new Date();
        await message.save();

        // Update conversation unread count
        if (message.threadId) {
            const conversation = await Conversation.findById(message.threadId);
            if (conversation) {
                const unreadMap = conversation.unreadCount;
                unreadMap.set(userId.toString(), Math.max(0, (unreadMap.get(userId.toString()) || 1) - 1));
                conversation.unreadCount = unreadMap;
                await conversation.save();
            }
        }

        // Update notification
        await MessageNotification.updateOne(
            { messageId: id, userId },
            { isRead: true, readAt: new Date(), deliveryStatus: 'read' }
        );

        // Emit socket event (read receipt)
        const io = req.app.get('io');
        if (io && message.senderId) {
            io.to(message.senderId.toString()).emit('message_read', {
                messageId: id,
                readAt: new Date(),
                readBy: userId
            });
        }

        res.status(200).json({
            message: "Marked as read",
            data: message
        });
    } catch (error) {
        console.error('❌ Mark as read error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== GET UNREAD COUNT ==========
export const getUnreadCount = async (req, res) => {
    try {
        const { userId, role } = req;

        let query = {
            recipientId: userId,
            isRead: false,
            isDeleted: false
        };

        // Include broadcast messages for students
        if (role === 'student') {
            const student = await Student.findById(userId);
            
            const directCount = await Message.countDocuments({
                recipientId: userId,
                isRead: false,
                isDeleted: false
            });

            const broadcastCount = await Message.countDocuments({
                isBroadcast: true,
                'broadcastTo.year': student.year,
                'broadcastTo.branch': student.branch,
                'broadcastTo.section': student.section,
                isDeleted: false
            });

            // Check which broadcasts are read
            const broadcastMessages = await Message.find({
                isBroadcast: true,
                'broadcastTo.year': student.year,
                'broadcastTo.branch': student.branch,
                'broadcastTo.section': student.section,
                isDeleted: false
            }).select('_id');

            const readBroadcasts = await MessageNotification.countDocuments({
                userId,
                messageId: { $in: broadcastMessages.map(m => m._id) },
                isRead: true
            });

            const unreadCount = directCount + (broadcastCount - readBroadcasts);

            return res.status(200).json({
                message: "Unread count fetched",
                unreadCount,
                details: {
                    direct: directCount,
                    broadcast: broadcastCount - readBroadcasts
                }
            });
        }

        const unreadCount = await Message.countDocuments(query);

        res.status(200).json({
            message: "Unread count fetched",
            unreadCount
        });
    } catch (error) {
        console.error('❌ Get unread count error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== GET CONVERSATIONS ==========
export const getConversations = async (req, res) => {
    try {
        const { userId } = req;

        const conversations = await Conversation.find({
            'participants.userId': userId,
            isActive: true,
            isArchived: false
        })
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean();

        // Get unread count for user
        const conversationsWithUnread = conversations.map(conv => ({
            ...conv,
            unreadCount: conv.unreadCount.get(userId.toString()) || 0
        }));

        res.status(200).json({
            message: "Conversations fetched successfully",
            conversations: conversationsWithUnread
        });
    } catch (error) {
        console.error('❌ Get conversations error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== ARCHIVE MESSAGE ==========
export const archiveMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req;

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Verify ownership
        if (message.senderId.toString() !== userId.toString() && 
            message.recipientId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        message.isArchived = true;
        await message.save();

        res.status(200).json({
            message: "Message archived",
            data: message
        });
    } catch (error) {
        console.error('❌ Archive error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== DELETE MESSAGE ==========
export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req;

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Verify ownership
        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        message.isDeleted = true;
        await message.save();

        res.status(200).json({
            message: "Message deleted"
        });
    } catch (error) {
        console.error('❌ Delete error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== GET STUDENT LIST (Faculty only) ==========
export const getStudentList = async (req, res) => {
    try {
        const { search = '', year, branch, section } = req.query;

        let query = {};

        if (year) query.year = parseInt(year);
        if (branch) query.branch = branch;
        if (section) query.section = section;

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { rollno: { $regex: search, $options: 'i' } }
            ];
        }

        const students = await Student.find(query)
            .select('name rollno year branch section')
            .sort({ rollno: 1 })
            .limit(100)
            .lean();

        res.status(200).json({
            message: "Students fetched successfully",
            students
        });
    } catch (error) {
        console.error('❌ Get students error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== GET FACULTY LIST (Student only) ==========
export const getFacultyList = async (req, res) => {
    try {
        const studentId = req.studentId;

        // Get student's subjects to find their faculty
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const { Subject } = await import('../models/subject.model.js');
        const subjects = await Subject.find({
            year: student.year,
            branch: student.branch,
            section: student.section
        }).populate('faculty', 'name empId');

        // Get unique faculty
        const facultyMap = new Map();
        subjects.forEach(subject => {
            if (subject.faculty) {
                facultyMap.set(subject.faculty._id.toString(), {
                    _id: subject.faculty._id,
                    name: subject.faculty.name,
                    empId: subject.faculty.empId
                });
            }
        });

        const faculties = Array.from(facultyMap.values());

        res.status(200).json({
            message: "Faculty list fetched successfully",
            faculties
        });
    } catch (error) {
        console.error('❌ Get faculty error:', error);
        res.status(500).json({ message: error.message });
    }
};