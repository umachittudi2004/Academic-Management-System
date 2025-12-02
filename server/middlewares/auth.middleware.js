import jwt from 'jsonwebtoken';

export const authMiddleware = (req,res,next) => {
    try {
        const token = req?.cookies?.token || req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });
        const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
        if (!decoded) return res.status(401).json({ message: "Invalid Token"});
        req.userId = decoded.id;
        req.role = decoded.role;
        if (decoded.role === 'student') {
            req.studentId = decoded.id;
        } else if (decoded.role === 'faculty') {
            req.facultyId = decoded.id;
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}