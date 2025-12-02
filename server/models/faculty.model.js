import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
    empId : {
        type : String,
        required : true,
        unique : true,
    },
    name : {
        type : String,
    },
    branch : {
        type : String,
    },
    password : {
        type : String,
        required : true,
    },
    isHashed : {
        type : Boolean,
        default : false,
    },
    img : {
        type : String,
    },
    sessionId : {
        type : String,
        default : null
    },
    subjects : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Subject"
        }
    ]
},{timestamps:true})

export const Faculty = mongoose.model("Faculty",facultySchema)