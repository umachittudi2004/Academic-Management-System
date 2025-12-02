import mongoose from "mongoose";

const noticeReadSchema = new mongoose.Schema({
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
    readAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent duplicate reads
noticeReadSchema.index({ noticeId: 1, studentId: 1 }, { unique: true });

export const NoticeRead = mongoose.model("NoticeRead", noticeReadSchema);