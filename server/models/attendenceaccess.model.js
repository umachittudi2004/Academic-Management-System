import mongoose from "mongoose";

const attendenceAcessSchema = new mongoose.Schema({
    subjectId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Subject",
        required : true,
    },
    facultyId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Faculty",
        required : true,
    },
    year : Number,
    branch : String,
    section : String,
    isActive : {
        type : Boolean,
        default : false,
    },
    createdAt : {
        type : Date,
        default : Date.now,
        expires : 1800,
    }
})

export const AttendenceAccess = mongoose.model("AttendenceAccess", attendenceAcessSchema) // AttendenceAccess model