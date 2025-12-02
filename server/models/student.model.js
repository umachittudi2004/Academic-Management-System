import mongoose from "mongoose";
const studentSchema = new mongoose.Schema({
    rollno : {
        type: String,
        required: true,
        unique: true
    },
    name : {
        type: String,
    },
    branch : {
        type: String,
    },
    section : {
        type: String,
    },
    college : {
        type: String,
    },
    password : {
        type: String,
        required: true,
    },
    isHashed : {
        type: Boolean,
        default: false
    },
    img : {
        type: String
    },
    status : {
        type: String,
        enum : ['active', 'inactive'],
        default: 'active'
    },
    phoneno : {
        type: Number,
    },
    year : {
        type: Number,
    },
    Transport : {
        type: String,
    },
    fatherName : {
        type: String,
    },
    motherName : {
        type: String,
    },
    email : {
        type: String,
        required: true,
        unique: true,
    },
    sessionId: {
        type: String,
        default: null
    }
},{
    timestamps: true
})

export const Student = mongoose.model('Student',studentSchema)