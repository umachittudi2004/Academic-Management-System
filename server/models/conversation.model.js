import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    // Participants
    participants: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                refPath: 'participants.userType'
            },
            userType: {
                type: String,
                enum: ['Student', 'Faculty'],
                required: true
            },
            userName: String
        }
    ],
    
    // Thread Type
    type: {
        type: String,
        enum: ['direct', 'broadcast'],
        default: 'direct'
    },
    
    // Last Message
    lastMessage: {
        content: String,
        sentAt: Date,
        senderId: mongoose.Schema.Types.ObjectId
    },
    
    // Unread Count per User (stored as object)
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true 
});

// Indexes
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ isActive: 1, isArchived: 1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);