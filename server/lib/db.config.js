import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async () => {
    try {
        // Fix: Add connection options and proper error handling
        const connection = await mongoose.connect(process.env.MONGO_URL, {
            // Add recommended Mongoose 6+ connection options
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("MongoDB connected");
        return connection;
    } catch (error) {
        console.log("MongoDB connection error:", error);
        // Fix: Throw error to allow handling at application level
        throw new Error("Failed to connect to database");
    }
}