import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    // Sender Info
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderType'
    },
    senderType: {
        type: String,
        enum: ['Student', 'Faculty'],
        required: true
    },
    senderName: {
        type: String,
        required: true
    },

    // Recipient Info
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'recipientType',
        default: null
    },
    recipientType: {
        type: String,
        enum: ['Student', 'Faculty', 'Class'],
        default: null
    },
    recipientName: {
        type: String,
        default: ""
    },

    // Broadcast Info
    isBroadcast: {
        type: Boolean,
        default: false
    },
    broadcastTo: {
        year: Number,
        branch: String,
        section: String
    },

    // Message Content
    subject: {
        type: String,
        required: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000
    },

    // Attachments
    attachments: [
        {
            fileName: String,
            googleDriveLink: String,
            fileId: String,
            mimeType: String,
            size: Number,
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    // Status
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },

    // Thread Info
    threadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        default: null
    },
    parentMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },

    // Priority
    priority: {
        type: String,
        enum: ['normal', 'high', 'urgent'],
        default: 'normal'
    },

    // Group Reference (if this is a group message)
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null
    },

    // @Mentions (tagged members)
    mentions: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            userName: {
                type: String,
                required: true
            },
            userType: {
                type: String,
                enum: ['Student', 'Faculty'],
                required: true
            },
            position: {
                type: Number,  // Character position in message
                default: 0
            }
        }
    ]
}, {
    timestamps: true
});

// Indexes
messageSchema.index({ senderId: 1, senderType: 1 });
messageSchema.index({ recipientId: 1, recipientType: 1 });
messageSchema.index({ threadId: 1, createdAt: -1 });
messageSchema.index({ isRead: 1, isDeleted: 1 });
messageSchema.index({ isBroadcast: 1 });
messageSchema.index({ groupId: 1, createdAt: -1 });  // ← NEW INDEX
messageSchema.index({ 'mentions.userId': 1 });       // ← NEW INDEX
messageSchema.index({ messageType: 1 });             // ← NEW INDEX

// ========== VIRTUAL FIELDS ==========

// Check if message is in a group
messageSchema.virtual('isGroupMessage').get(function () {
    return !!this.groupId;
});

// Get mention count
messageSchema.virtual('mentionCount').get(function () {
    return this.mentions ? this.mentions.length : 0;
});

// ========== INSTANCE METHODS ==========

// Check if user is mentioned
messageSchema.methods.isMentionedUser = function (userId) {
    return this.mentions.some(m => m.userId.toString() === userId.toString());
};

// Get mentioned user IDs
messageSchema.methods.getMentionedUserIds = function () {
    return this.mentions.map(m => m.userId);
};

// ========== STATIC METHODS ==========

// Find all group messages
messageSchema.statics.findGroupMessages = function (groupId, limit = 50) {
    return this.find({
        groupId,
        isDeleted: false
    })
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Find messages with mentions for user
messageSchema.statics.findMentionsForUser = function (userId) {
    return this.find({
        'mentions.userId': userId,
        isDeleted: false
    })
        .sort({ createdAt: -1 });
};

// Search messages in group
messageSchema.statics.searchInGroup = function (groupId, searchTerm, limit = 50) {
    return this.find({
        groupId,
        content: { $regex: searchTerm, $options: 'i' },
        isDeleted: false
    })
        .sort({ createdAt: -1 })
        .limit(limit);
};

export const Message = mongoose.model("Message", messageSchema);