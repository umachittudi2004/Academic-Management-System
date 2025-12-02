import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    subjectName : {
        type : String,
        required : true,
    },
    subjectCode : {
        type : String,
        required : true,
    },
    year : {
        type : Number,
        required : true,
    },
    section : {
        type : String,
        required : true,
    },
    branch : {
        type : String,
        required : true,
    },
    faculty : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Faculty",
        required : true,
    },
},{timestamps:true})

export const Subject = mongoose.model("Subject", subjectSchema)