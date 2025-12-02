import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    submittedFiles: [
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
    submittedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['submitted', 'graded', 'returned'],
        default: 'submitted'
    },
    isLate: {
        type: Boolean,
        default: false
    },
    remarks: {
        type: String,
        maxlength: 1000,
        default: ""
    }
}, { 
    timestamps: true 
});

// Compound index to ensure one submission per student per assignment
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ studentId: 1 });
submissionSchema.index({ assignmentId: 1, status: 1 });

export const Submission = mongoose.model("Submission", submissionSchema);