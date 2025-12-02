import mongoose from "mongoose";

const attendenceSchema = new mongoose.Schema({
    studentId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Student",
        required : true,
    },
    subjectId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Subject",
        required : true,
    },
    status : {
        type : String,
        enum : ["P", "A"],
        required : true,
    }
},{
    timestamps : true
})

export const Attendence = mongoose.model("Attendence", attendenceSchema) // Attendence model