import { Router } from "express";
import {
    createGroup,
    getFacultyGroups,
    getStudentGroups,
    getGroupDetails,
    addMembers,
    removeMember,
    leaveGroup,
    handleLeaveRequest,
    updateGroupSettings,
    updateGroupInfo,
    deleteGroup,
    toggleMuteGroup,
    getPendingLeaveRequests
} from "../controllers/group.controller.js";
import {
    sendGroupMessage,
    getGroupMessages,
    searchGroupMessages,
    sendTypingIndicator,
    deleteGroupMessage
} from "../controllers/groupMessage.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { facultyAuthCheck } from "../middlewares/facultyAuthCheck.middleware.js";
import { studentAuthCheck } from "../middlewares/studentauth.middleware.js";
import { upload } from "../lib/multer.config.js";

const groupRouter = Router();

// ========== GROUP MANAGEMENT ROUTES ==========

// Create Group (Faculty Only)
groupRouter.post("/create",
    authMiddleware,
    facultyAuthCheck,
    createGroup
);

// Get Faculty Groups
groupRouter.get("/faculty",
    authMiddleware,
    facultyAuthCheck,
    getFacultyGroups
);

// Get Student Groups
groupRouter.get("/student",
    authMiddleware,
    studentAuthCheck,
    getStudentGroups
);

// Get Group Details
groupRouter.get("/:id",
    authMiddleware,
    getGroupDetails
);

// Add Members (Faculty Only - Creator Only)
groupRouter.post("/:id/members/add",
    authMiddleware,
    facultyAuthCheck,
    addMembers
);

// Remove Member (Faculty Only - Creator Only)
groupRouter.post("/:id/members/remove",
    authMiddleware,
    facultyAuthCheck,
    removeMember
);

// Leave Group (Student)
groupRouter.post("/:id/leave",
    authMiddleware,
    studentAuthCheck,
    leaveGroup
);

// Handle Leave Request (Faculty Only - Creator Only)
groupRouter.post("/:id/leave-request/handle",
    authMiddleware,
    facultyAuthCheck,
    handleLeaveRequest
);

// Get Pending Leave Requests (Faculty Only)
groupRouter.get("/leave-requests/pending",
    authMiddleware,
    facultyAuthCheck,
    getPendingLeaveRequests
);

// Update Group Settings (Faculty Only - Creator Only)
groupRouter.put("/:id/settings",
    authMiddleware,
    facultyAuthCheck,
    updateGroupSettings
);

// Update Group Info (Faculty Only - Creator Only)
groupRouter.put("/:id/info",
    authMiddleware,
    facultyAuthCheck,
    updateGroupInfo
);

// Delete Group (Faculty Only - Creator Only)
groupRouter.delete("/:id",
    authMiddleware,
    facultyAuthCheck,
    deleteGroup
);

// Toggle Mute Group
groupRouter.post("/:id/mute",
    authMiddleware,
    toggleMuteGroup
);

// ========== GROUP MESSAGING ROUTES ==========

// Send Message in Group
groupRouter.post("/:id/messages/send",
    authMiddleware,
    upload.array('attachments', 5),
    sendGroupMessage
);

// Get Group Messages
groupRouter.get("/:id/messages",
    authMiddleware,
    getGroupMessages
);

// Search Messages in Group
groupRouter.get("/:id/messages/search",
    authMiddleware,
    searchGroupMessages
);

// Send Typing Indicator
groupRouter.post("/:id/typing",
    authMiddleware,
    sendTypingIndicator
);

// Delete Message
groupRouter.delete("/messages/:id",
    authMiddleware,
    deleteGroupMessage
);

export default groupRouter;