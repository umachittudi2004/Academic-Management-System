import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 5000
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
        required: true,
        min: 1,
        max: 4
    },
    branch: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    dueDate: {
        type: Date,
        required: true
    },
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
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true 
});

// Index for faster queries
assignmentSchema.index({ facultyId: 1, isActive: 1 });
assignmentSchema.index({ year: 1, branch: 1, section: 1, isActive: 1 });
assignmentSchema.index({ subjectId: 1, isActive: 1 });
assignmentSchema.index({ dueDate: 1 });

export const Assignment = mongoose.model("Assignment", assignmentSchema);