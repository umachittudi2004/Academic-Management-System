import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema({
    submissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission",
        required: true,
        unique: true // One grade per submission
    },
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
    marksObtained: {
        type: Number,
        required: true,
        min: 0
    },
    totalMarks: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        min: 0,
        max: 100
    },
    feedback: {
        type: String,
        maxlength: 2000,
        default: ""
    },
    gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty",
        required: true
    },
    gradedAt: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true 
});

// Calculate percentage before saving
gradeSchema.pre('save', function(next) {
    if (this.totalMarks > 0) {
        this.percentage = (this.marksObtained / this.totalMarks) * 100;
    }
    next();
});

// Indexes
gradeSchema.index({ studentId: 1, assignmentId: 1 });
gradeSchema.index({ assignmentId: 1 });
gradeSchema.index({ submissionId: 1 });

export const Grade = mongoose.model("Grade", gradeSchema);