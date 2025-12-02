import jwt from 'jsonwebtoken';

export const studentAuthCheck = (req, res, next) => {
    try {
        const token = req?.cookies?.token || req?.headers?.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" })
        const decode = jwt.verify(token, process.env.JWT_SECRETKEY)
        if (!decode) return res.status(401).json({ message: "Unauthorized" })
        req.studentId = decode.studentId || decode.id
        next()
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message })
    }
}