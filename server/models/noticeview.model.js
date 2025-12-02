import mongoose from "mongoose";

const noticeViewSchema = new mongoose.Schema({
    noticeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notice',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    viewCount: {
        type: Number,
        default: 1
    },
    firstViewedAt: {
        type: Date,
        default: Date.now
    },
    lastViewedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for unique student per notice
noticeViewSchema.index({ noticeId: 1, studentId: 1 }, { unique: true });

export const NoticeView = mongoose.model("NoticeView", noticeViewSchema);