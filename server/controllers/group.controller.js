import { Group } from "../models/group.model.js";
import { Message } from "../models/message.model.js";
import { MessageNotification } from "../models/messageNotification.model.js";
import { Student } from "../models/student.model.js";
import { Faculty } from "../models/faculty.model.js";

// ========== CREATE GROUP ==========
export const createGroup = async (req, res) => {
    try {
        const facultyId = req.facultyId;
        const { name, description, memberIds, settings } = req.body;

        if (!name || !memberIds || memberIds.length === 0) {
            return res.status(400).json({ message: "Group name and members are required" });
        }

        // Get faculty info
        const faculty = await Faculty.findById(facultyId);
        if (!faculty) {
            return res.status(404).json({ message: "Faculty not found" });
        }

        // Validate and fetch member details
        const members = [];
        
        // Add creator as admin
        members.push({
            userId: facultyId,
            userType: 'Faculty',
            userName: faculty.name,
            rollNumber: null,
            role: 'admin',
            addedBy: facultyId
        });

        // Add students
        for (const memberId of memberIds) {
            const student = await Student.findById(memberId);
            if (student) {
                members.push({
                    userId: student._id,
                    userType: 'Student',
                    userName: student.name,
                    rollNumber: student.rollno,
                    role: 'member',
                    addedBy: facultyId
                });
            }
        }

        if (members.length === 1) {
            return res.status(400).json({ message: "At least one student member is required" });
        }

        // Create group
        const group = await Group.create({
            name,
            description: description || "",
            createdBy: facultyId,
            creatorName: faculty.name,
            members,
            settings: settings || {},
            stats: {
                totalMemberCount: members.length
            }
        });

        console.log(`✅ Group created: ${group.name} with ${members.length} members`);

        // Send notifications to all members (except creator)
        const notifications = [];
        for (const member of members) {
            if (member.userId.toString() !== facultyId.toString()) {
                notifications.push({
                    userId: member.userId,
                    userType: member.userType,
                    messageId: null,
                    groupId: group._id,
                    groupName: group.name,
                    title: `Added to group: ${group.name}`,
                    body: `${faculty.name} added you to the group`,
                    senderName: faculty.name,
                    senderType: 'Faculty',
                    notificationType: 'group_update'
                });
            }
        }

        if (notifications.length > 0) {
            await MessageNotification.insertMany(notifications);
        }

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            members.forEach(member => {
                if (member.userId.toString() !== facultyId.toString()) {
                    io.to(member.userId.toString()).emit('group_created', {
                        groupId: group._id,
                        groupName: group.name,
                        creatorName: faculty.name
                    });
                }
            });
        }

        res.status(201).json({
            message: "Group created successfully",
            group
        });
    } catch (error) {
        console.error('❌ Create group error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== GET FACULTY GROUPS ==========
export const getFacultyGroups = async (req, res) => {
    try {
        const facultyId = req.facultyId;

        const groups = await Group.find({
            createdBy: facultyId,
            isActive: true
        }).sort({ updatedAt: -1 });

        // Get unread count for each group
        const groupsWithUnread = await Promise.all(
            groups.map(async (group) => {
                const unreadCount = await group.getUnreadCount(facultyId);
                return {
                    ...group.toObject(),
                    unreadCount
                };
            })
        );

        res.status(200).json({
            message: "Groups fetched successfully",
            groups: groupsWithUnread
        });
    } catch (error) {
        console.error('❌ Get faculty groups error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== GET STUDENT GROUPS ==========
export const getStudentGroups = async (req, res) => {
    try {
        const studentId = req.studentId;

        const groups = await Group.find({
            'members.userId': studentId,
            isActive: true
        }).sort({ 'lastMessage.sentAt': -1 });

        // Get unread count for each group
        const groupsWithUnread = await Promise.all(
            groups.map(async (group) => {
                const unreadCount = await group.getUnreadCount(studentId);
                return {
                    ...group.toObject(),
                    unreadCount
                };
            })
        );

        res.status(200).json({
            message: "Groups fetched successfully",
            groups: groupsWithUnread
        });
    } catch (error) {
        console.error('❌ Get student groups error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== GET GROUP DETAILS ==========
export const getGroupDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role } = req;

        const group = await Group.findById(id);
        if (!group || !group.isActive) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is member
        if (!group.isMember(userId)) {
            return res.status(403).json({ message: "Access denied. You are not a member of this group." });
        }

        // Get unread count
        const unreadCount = await group.getUnreadCount(userId);

        res.status(200).json({
            message: "Group details fetched",
            group: {
                ...group.toObject(),
                unreadCount
            }
        });
    } catch (error) {
        console.error('❌ Get group details error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== ADD MEMBERS TO GROUP ==========
export const addMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyId = req.facultyId;
        const { memberIds } = req.body;

        if (!memberIds || memberIds.length === 0) {
            return res.status(400).json({ message: "Member IDs are required" });
        }

        const group = await Group.findById(id);
        if (!group || !group.isActive) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Only creator can add members
        if (!group.isCreator(facultyId)) {
            return res.status(403).json({ message: "Only the group creator can add members" });
        }

        const faculty = await Faculty.findById(facultyId);
        const addedMembers = [];

        // Add each member
        for (const memberId of memberIds) {
            // Check if already member
            if (group.isMember(memberId)) {
                continue;
            }

            const student = await Student.findById(memberId);
            if (student) {
                const memberData = {
                    userId: student._id,
                    userType: 'Student',
                    userName: student.name,
                    rollNumber: student.rollno,
                    role: 'member',
                    addedBy: facultyId
                };

                group.addMember(memberData);
                addedMembers.push(student);
            }
        }

        if (addedMembers.length === 0) {
            return res.status(400).json({ message: "No new members added" });
        }

        await group.save();

        console.log(`✅ Added ${addedMembers.length} members to group: ${group.name}`);

        // Send notifications to new members
        const notifications = addedMembers.map(student => ({
            userId: student._id,
            userType: 'Student',
            messageId: null,
            groupId: group._id,
            groupName: group.name,
            title: `Added to group: ${group.name}`,
            body: `${faculty.name} added you to the group`,
            senderName: faculty.name,
            senderType: 'Faculty',
            notificationType: 'group_update'
        }));

        await MessageNotification.insertMany(notifications);

        // Emit socket events
        const io = req.app.get('io');
        if (io) {
            // Notify new members
            addedMembers.forEach(student => {
                io.to(student._id.toString()).emit('added_to_group', {
                    groupId: group._id,
                    groupName: group.name,
                    addedBy: faculty.name
                });
            });

            // Notify existing members
            group.members.forEach(member => {
                if (!addedMembers.some(s => s._id.toString() === member.userId.toString())) {
                    io.to(member.userId.toString()).emit('members_added', {
                        groupId: group._id,
                        addedMembers: addedMembers.map(s => ({
                            userId: s._id,
                            userName: s.name,
                            rollNumber: s.rollno
                        }))
                    });
                }
            });
        }

        res.status(200).json({
            message: `${addedMembers.length} member(s) added successfully`,
            group,
            addedMembers: addedMembers.map(s => ({
                userId: s._id,
                userName: s.name,
                rollNumber: s.rollno
            }))
        });
    } catch (error) {
        console.error('❌ Add members error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== REMOVE MEMBER FROM GROUP ==========
export const removeMember = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyId = req.facultyId;
        const { memberId } = req.body;

        if (!memberId) {
            return res.status(400).json({ message: "Member ID is required" });
        }

        const group = await Group.findById(id);
        if (!group || !group.isActive) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Only creator can remove members
        if (!group.isCreator(facultyId)) {
            return res.status(403).json({ message: "Only the group creator can remove members" });
        }

        // Can't remove creator
        if (memberId === facultyId.toString()) {
            return res.status(400).json({ message: "Cannot remove group creator" });
        }

        // Check if user is member
        if (!group.isMember(memberId)) {
            return res.status(404).json({ message: "User is not a member of this group" });
        }

        const removedMember = group.getMember(memberId);
        group.removeMember(memberId);
        await group.save();

        console.log(`✅ Removed member from group: ${removedMember.userName}`);

        // Notify removed member
        await MessageNotification.create({
            userId: memberId,
            userType: 'Student',
            messageId: null,
            groupId: group._id,
            groupName: group.name,
            title: `Removed from group: ${group.name}`,
            body: `You have been removed from the group`,
            senderName: group.creatorName,
            senderType: 'Faculty',
            notificationType: 'group_update'
        });

        // Emit socket events
        const io = req.app.get('io');
        if (io) {
            // Notify removed member
            io.to(memberId.toString()).emit('removed_from_group', {
                groupId: group._id,
                groupName: group.name
            });

            // Notify remaining members
            group.members.forEach(member => {
                io.to(member.userId.toString()).emit('member_removed', {
                    groupId: group._id,
                    removedMember: {
                        userId: removedMember.userId,
                        userName: removedMember.userName
                    }
                });
            });
        }

        res.status(200).json({
            message: "Member removed successfully",
            group
        });
    } catch (error) {
        console.error('❌ Remove member error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== LEAVE GROUP (Student) ==========
export const leaveGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.studentId;
        const { reason } = req.body;

        const group = await Group.findById(id);
        if (!group || !group.isActive) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is member
        if (!group.isMember(studentId)) {
            return res.status(404).json({ message: "You are not a member of this group" });
        }

        const student = await Student.findById(studentId);

        // Check if free leave is allowed
        if (group.settings.allowFreeLeave) {
            // Leave immediately
            group.removeMember(studentId);
            await group.save();

            console.log(`✅ Student left group: ${student.name} from ${group.name}`);

            // Notify creator
            await MessageNotification.create({
                userId: group.createdBy,
                userType: 'Faculty',
                messageId: null,
                groupId: group._id,
                groupName: group.name,
                title: `${student.name} left the group`,
                body: `${student.name} (${student.rollno}) has left ${group.name}`,
                senderName: student.name,
                senderType: 'Student',
                notificationType: 'group_update'
            });

            // Emit socket event
            const io = req.app.get('io');
            if (io) {
                group.members.forEach(member => {
                    io.to(member.userId.toString()).emit('member_left', {
                        groupId: group._id,
                        leftMember: {
                            userId: studentId,
                            userName: student.name
                        }
                    });
                });
            }

            res.status(200).json({
                message: "Left group successfully"
            });
        } else {
            // Request approval
            group.requestLeave(studentId, reason);
            await group.save();

            console.log(`✅ Leave request submitted: ${student.name} from ${group.name}`);

            // Notify creator
            await MessageNotification.create({
                userId: group.createdBy,
                userType: 'Faculty',
                messageId: null,
                groupId: group._id,
                groupName: group.name,
                title: `Leave request from ${student.name}`,
                body: `${student.name} wants to leave ${group.name}. Reason: ${reason || 'No reason provided'}`,
                senderName: student.name,
                senderType: 'Student',
                notificationType: 'group_update'
            });

            // Emit socket event
            const io = req.app.get('io');
            if (io) {
                io.to(group.createdBy.toString()).emit('leave_request', {
                    groupId: group._id,
                    groupName: group.name,
                    student: {
                        userId: studentId,
                        userName: student.name,
                        rollNumber: student.rollno
                    },
                    reason: reason || ""
                });
            }

            res.status(200).json({
                message: "Leave request sent to group admin. Awaiting approval.",
                requiresApproval: true
            });
        }
    } catch (error) {
        console.error('❌ Leave group error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== HANDLE LEAVE REQUEST (Faculty) ==========
export const handleLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyId = req.facultyId;
        const { memberId, approved } = req.body;

        if (!memberId || approved === undefined) {
            return res.status(400).json({ message: "Member ID and approval status are required" });
        }

        const group = await Group.findById(id);
        if (!group || !group.isActive) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Only creator can handle leave requests
        if (!group.isCreator(facultyId)) {
            return res.status(403).json({ message: "Only the group creator can handle leave requests" });
        }

        const member = group.getMember(memberId);
        if (!member || !member.leaveRequestPending) {
            return res.status(404).json({ message: "No pending leave request from this member" });
        }

        const student = await Student.findById(memberId);
        group.handleLeaveRequest(memberId, approved);
        await group.save();

        // Notify student
        await MessageNotification.create({
            userId: memberId,
            userType: 'Student',
            messageId: null,
            groupId: group._id,
            groupName: group.name,
            title: approved ? 'Leave request approved' : 'Leave request rejected',
            body: approved 
                ? `Your leave request for ${group.name} has been approved`
                : `Your leave request for ${group.name} has been rejected`,
            senderName: group.creatorName,
            senderType: 'Faculty',
            notificationType: 'group_update'
        });

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(memberId.toString()).emit('leave_request_response', {
                groupId: group._id,
                groupName: group.name,
                approved
            });

            if (approved) {
                // Notify remaining members
                group.members.forEach(member => {
                    io.to(member.userId.toString()).emit('member_left', {
                        groupId: group._id,
                        leftMember: {
                            userId: memberId,
                            userName: student.name
                        }
                    });
                });
            }
        }

        res.status(200).json({
            message: approved ? 'Leave request approved' : 'Leave request rejected',
            group
        });
    } catch (error) {
        console.error('❌ Handle leave request error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== UPDATE GROUP SETTINGS ==========
export const updateGroupSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyId = req.facultyId;
        const { settings } = req.body;

        const group = await Group.findById(id);
        if (!group || !group.isActive) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Only creator can update settings
        if (!group.isCreator(facultyId)) {
            return res.status(403).json({ message: "Only the group creator can update settings" });
        }

        // Update settings
        group.settings = { ...group.settings, ...settings };
        await group.save();

        console.log(`✅ Updated settings for group: ${group.name}`);

        res.status(200).json({
            message: "Settings updated successfully",
            group
        });
    } catch (error) {
        console.error('❌ Update settings error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== UPDATE GROUP INFO ==========
export const updateGroupInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyId = req.facultyId;
        const { name, description } = req.body;

        const group = await Group.findById(id);
        if (!group || !group.isActive) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Only creator can update info
        if (!group.isCreator(facultyId)) {
            return res.status(403).json({ message: "Only the group creator can update group info" });
        }

        if (name) group.name = name;
        if (description !== undefined) group.description = description;
        
        await group.save();

        console.log(`✅ Updated info for group: ${group.name}`);

        // Notify all members
        const io = req.app.get('io');
        if (io) {
            group.members.forEach(member => {
                io.to(member.userId.toString()).emit('group_updated', {
                    groupId: group._id,
                    updates: { name, description }
                });
            });
        }

        res.status(200).json({
            message: "Group info updated successfully",
            group
        });
    } catch (error) {
        console.error('❌ Update group info error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== DELETE GROUP ==========
export const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyId = req.facultyId;

        const group = await Group.findById(id);
        if (!group || !group.isActive) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Only creator can delete
        if (!group.isCreator(facultyId)) {
            return res.status(403).json({ message: "Only the group creator can delete the group" });
        }

        // Soft delete
        group.isActive = false;
        group.deletedAt = new Date();
        group.deletedBy = facultyId;
        await group.save();

        console.log(`✅ Deleted group: ${group.name}`);

        // Notify all members
        const notifications = group.members
            .filter(m => m.userId.toString() !== facultyId.toString())
            .map(member => ({
                userId: member.userId,
                userType: member.userType,
                messageId: null,
                groupId: group._id,
                groupName: group.name,
                title: `Group deleted: ${group.name}`,
                body: `${group.creatorName} has deleted the group`,
                senderName: group.creatorName,
                senderType: 'Faculty',
                notificationType: 'group_update'
            }));

        if (notifications.length > 0) {
            await MessageNotification.insertMany(notifications);
        }

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            group.members.forEach(member => {
                io.to(member.userId.toString()).emit('group_deleted', {
                    groupId: group._id,
                    groupName: group.name
                });
            });
        }

        res.status(200).json({
            message: "Group deleted successfully"
        });
    } catch (error) {
        console.error('❌ Delete group error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== TOGGLE MUTE GROUP ==========
export const toggleMuteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req;

        const group = await Group.findById(id);
        if (!group || !group.isActive) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.isMember(userId)) {
            return res.status(403).json({ message: "Access denied" });
        }

        group.toggleMute(userId);
        await group.save();

        const member = group.getMember(userId);

        res.status(200).json({
            message: member.isMuted ? "Group muted" : "Group unmuted",
            isMuted: member.isMuted
        });
    } catch (error) {
        console.error('❌ Toggle mute error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== GET PENDING LEAVE REQUESTS (Faculty) ==========
export const getPendingLeaveRequests = async (req, res) => {
    try {
        const facultyId = req.facultyId;

        const groups = await Group.find({
            createdBy: facultyId,
            isActive: true,
            'members.leaveRequestPending': true
        });

        const pendingRequests = [];

        for (const group of groups) {
            const requestingMembers = group.members.filter(m => m.leaveRequestPending);
            
            for (const member of requestingMembers) {
                const student = await Student.findById(member.userId);
                pendingRequests.push({
                    groupId: group._id,
                    groupName: group.name,
                    student: {
                        userId: student._id,
                        userName: student.name,
                        rollNumber: student.rollno
                    },
                    reason: member.leaveReason,
                    requestedAt: member.leaveRequestedAt
                });
            }
        }

        res.status(200).json({
            message: "Pending leave requests fetched",
            requests: pendingRequests
        });
    } catch (error) {
        console.error('❌ Get pending requests error:', error);
        res.status(500).json({ message: error.message });
    }
};