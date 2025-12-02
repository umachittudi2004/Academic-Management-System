import mongoose from "mongoose";

const messageNotificationSchema = new mongoose.Schema({
    // Recipient
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'userType'
    },
    userType: {
        type: String,
        enum: ['Student', 'Faculty'],
        required: true
    },

    // Message Reference
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: false,
        default: null
    },

    // Notification Details
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },

    // Sender Info (for quick display)
    senderName: String,
    senderType: String,

    // Status
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },

    // Delivery
    deliveryStatus: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    },

    // Group Reference
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null
    },

    groupName: {
        type: String,
        default: null
    },

    // Notification Type
    notificationType: {
        type: String,
        enum: ['direct', 'broadcast', 'group', 'mention', 'group_update'],
        default: 'direct'
    },

    // Is this a mention notification?
    isMention: {
        type: Boolean,
        default: false
    },

    // Additional metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }

}, {
    timestamps: true
});

// Indexes
messageNotificationSchema.index({ userId: 1, isRead: 1 });
messageNotificationSchema.index({ messageId: 1 });
messageNotificationSchema.index({ createdAt: -1 });
messageNotificationSchema.index({ groupId: 1 });              // ← NEW
messageNotificationSchema.index({ notificationType: 1 });     // ← NEW
messageNotificationSchema.index({ isMention: 1 });            // ← NEW


// ========== STATIC METHODS ==========

// Get unread count for user
messageNotificationSchema.statics.getUnreadCountForUser = function (userId) {
    return this.countDocuments({
        userId,
        isRead: false
    });
};

// Get unread group notifications
messageNotificationSchema.statics.getUnreadGroupNotifications = function (userId) {
    return this.find({
        userId,
        isRead: false,
        groupId: { $ne: null }
    }).sort({ createdAt: -1 });
};

// Get unread mentions
messageNotificationSchema.statics.getUnreadMentions = function (userId) {
    return this.find({
        userId,
        isRead: false,
        isMention: true
    }).sort({ createdAt: -1 });
};



export const MessageNotification = mongoose.model("MessageNotification", messageNotificationSchema);