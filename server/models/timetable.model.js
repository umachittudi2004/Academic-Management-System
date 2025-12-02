import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
    },
    periodNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    startTime: {
        type: String,  // Format: "09:00"
        required: true
    },
    endTime: {
        type: String,  // Format: "09:50"
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty",
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    roomNumber: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

timetableSchema.index({ 
    day: 1, 
    periodNumber: 1, 
    year: 1, 
    branch: 1, 
    section: 1 
}, { unique: true });

timetableSchema.index({ facultyId: 1, day: 1 });

export const Timetable = mongoose.model("Timetable", timetableSchema);