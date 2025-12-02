import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000
    },
    category: {
        type: String,
        enum: ['general', 'academic', 'event', 'exam', 'placement'],
        default: 'general'
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: true
    },
    
    // Target Audience (empty array = all)
    targetYear: {
        type: [Number],
        default: []
    },
    targetBranch: {
        type: [String],
        default: []
    },
    targetSection: {
        type: [String],
        default: []
    },
    
    // Attachments (Google Drive)
    attachments: [{
        fileName: String,
        googleDriveFileId: String,
        googleDriveLink: String,
        downloadLink: String,
        mimeType: String,
        size: Number,
        uploadedAt: Date
    }],
    
    // Flags
    isUrgent: {
        type: Boolean,
        default: false
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    
    // Scheduling
    publishDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        default: null
    },
    
    // Stats
    viewCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for better query performance
noticeSchema.index({ targetYear: 1 });
noticeSchema.index({ targetBranch: 1 });
noticeSchema.index({ targetSection: 1 });
noticeSchema.index({ publishDate: -1 });
noticeSchema.index({ isPinned: -1, publishDate: -1 });
noticeSchema.index({ postedBy: 1 });

export const Notice = mongoose.model("Notice", noticeSchema);