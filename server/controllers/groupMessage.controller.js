import { Group } from "../models/group.model.js";
import { Message } from "../models/message.model.js";
import { MessageNotification } from "../models/messageNotification.model.js";
import { Student } from "../models/student.model.js";
import { Faculty } from "../models/faculty.model.js";
import { uploadToDrive, deleteFromDrive } from '../lib/googleDrive.js';
import fs from 'fs';

// ========== SEND MESSAGE IN GROUP ==========
export const sendGroupMessage = async (req, res) => {
    try {
        const actualUserId = req.userId || req.studentId || req.facultyId;
        const role = req.role || (req.studentId ? 'student' : 'faculty');
        const { groupId, content, mentions } = req.body;

        if (!groupId) {
            return res.status(400).json({ message: "Group ID is required" });
        }

        if (!content && (!req.files || req.files.length === 0)) {
            return res.status(400).json({ message: "Message content or attachments are required" });
        }

        const group = await Group.findById(groupId);
        if (!group || !group.isActive) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.isMember(actualUserId)) {
            return res.status(403).json({ message: "Access denied. You are not a member of this group." });
        }

        if (role === 'student' && !group.settings.allowStudentMessages) {
            return res.status(403).json({ message: "Students are not allowed to send messages in this group" });
        }

        let sender;
        if (role === 'student') {
            sender = await Student.findById(actualUserId);
        } else {
            sender = await Faculty.findById(actualUserId);
        }

        if (!sender) {
            return res.status(404).json({ message: "Sender not found" });
        }

        const processedAttachments = [];
        if (req.files && req.files.length > 0) {
            if (!group.settings.allowFileSharing) {
                return res.status(403).json({ message: "File sharing is not allowed in this group" });
            }

            for (const file of req.files) {
                try {
                    const driveFile = await uploadToDrive(
                        file.path,
                        file.originalname,
                        file.mimetype,
                        `Messages/Groups/${group.name}`
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

        const processedMentions = [];
        if (mentions && mentions.length > 0 && group.settings.allowMentions) {
            for (const mention of mentions) {
                if (group.isMember(mention.userId)) {
                    processedMentions.push({
                        userId: mention.userId,
                        userName: mention.userName,
                        userType: mention.userType,
                        position: mention.position || 0
                    });
                }
            }
        }

        const message = await Message.create({
            senderId: actualUserId,
            senderType: role === 'student' ? 'Student' : 'Faculty',
            senderName: sender.name,
            groupId: groupId,
            subject: `Group: ${group.name}`,
            content,
            attachments: processedAttachments,
            mentions: processedMentions,
            messageType: 'group'
        });

        group.updateLastMessage(message);
        group.stats.messageCount += 1;
        if (processedAttachments.length > 0) {
            group.stats.fileCount += processedAttachments.length;
        }
        await group.save();

        console.log(`✅ Group message sent in ${group.name} by ${sender.name}`);

        const notifications = [];
        const mentionedUserIds = processedMentions.map(m => m.userId.toString());

        for (const member of group.members) {
            if (member.userId.toString() !== actualUserId.toString() && !member.isMuted) {
                const isMentioned = mentionedUserIds.includes(member.userId.toString());
                
                notifications.push({
                    userId: member.userId,
                    userType: member.userType,
                    messageId: message._id,
                    groupId: group._id,
                    groupName: group.name,
                    title: isMentioned 
                        ? `${sender.name} mentioned you in ${group.name}`
                        : `New message in ${group.name}`,
                    body: content.substring(0, 100),
                    senderName: sender.name,
                    senderType: role === 'student' ? 'Student' : 'Faculty',
                    notificationType: 'group',
                    isMention: isMentioned
                });
            }
        }

        if (notifications.length > 0) {
            await MessageNotification.insertMany(notifications);
        }

        const io = req.app.get('io');
        if (io) {
            const socketMessageData = {
                groupId: group._id.toString(),
                groupName: group.name,
                messageId: message._id.toString(),
                senderId: actualUserId.toString(),
                senderName: sender.name,
                content: message.content,
                mentions: processedMentions,
                attachments: processedAttachments,
                hasAttachments: processedAttachments.length > 0,
                createdAt: message.createdAt
            };

            group.members.forEach(member => {
                if (member.userId.toString() !== actualUserId.toString()) {
                    io.to(member.userId.toString()).emit('group_message', socketMessageData);
                }
            });
        }

        res.status(201).json({
            message: "Message sent successfully",
            data: message
        });
    } catch (error) {
        console.error('❌ Send group message error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== GET GROUP MESSAGES ==========
export const getGroupMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req;
        const { limit = 50, before } = req.query;

        const group = await Group.findById(id);
        if (!group || !group.isActive) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.status(403).json({ message: "Access denied" });
        }

        let query = {
            groupId: id,
            isDeleted: false
        };

        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        group.updateLastRead(userId);
        await group.save();

        res.status(200).json({
            message: "Messages fetched successfully",
            messages: messages.reverse(),
            hasMore: messages.length === parseInt(limit)
        });
    } catch (error) {
        console.error('❌ Get group messages error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== SEARCH MESSAGES IN GROUP ==========
export const searchGroupMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req;
        const { q, limit = 50 } = req.query;

        if (!q) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const group = await Group.findById(id);
        if (!group || !group.isActive) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.status(403).json({ message: "Access denied" });
        }

        const messages = await Message.searchInGroup(id, q, parseInt(limit));

        res.status(200).json({
            message: "Search results",
            query: q,
            results: messages,
            count: messages.length
        });
    } catch (error) {
        console.error('❌ Search messages error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== TYPING INDICATOR ==========
export const sendTypingIndicator = async (req, res) => {
    try {
        const { userId, role } = req;
        const { groupId, isTyping } = req.body;

        const group = await Group.findById(groupId);
        if (!group || !group.isActive) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.status(403).json({ message: "Access denied" });
        }

        let sender;
        if (role === 'student') {
            sender = await Student.findById(userId);
        } else {
            sender = await Faculty.findById(userId);
        }

        const io = req.app.get('io');
        if (io) {
            group.members.forEach(member => {
                if (member.userId.toString() !== userId.toString()) {
                    io.to(member.userId.toString()).emit('user_typing_in_group', {
                        groupId,
                        userId,
                        userName: sender.name,
                        isTyping
                    });
                }
            });
        }

        res.status(200).json({ message: "Typing indicator sent" });
    } catch (error) {
        console.error('❌ Typing indicator error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== DELETE MESSAGE ==========
export const deleteGroupMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req;

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const group = await Group.findById(message.groupId);
        
        if (!group || !group.isActive) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isCreator = group.isCreator(userId);
        const isSender = message.senderId.toString() === userId.toString();

        if (!isSender && !isCreator) {
            return res.status(403).json({ message: "Access denied" });
        }

        message.isDeleted = true;
        await message.save();

        if (group.stats.messageCount > 0) {
            group.stats.messageCount -= 1;
            await group.save();
        }

        const io = req.app.get('io');
        if (io) {
            group.members.forEach(member => {
                io.to(member.userId.toString()).emit('message_deleted', {
                    groupId: group._id.toString(),
                    messageId: id,
                    newMessageCount: group.stats.messageCount
                });
            });
        }

        console.log(`✅ Message deleted in group ${group.name}`);

        res.status(200).json({ 
            message: "Message deleted",
            newMessageCount: group.stats.messageCount
        });
    } catch (error) {
        console.error('❌ Delete message error:', error);
        res.status(500).json({ message: error.message });
    }
};