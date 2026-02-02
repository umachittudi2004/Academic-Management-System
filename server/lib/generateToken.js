import jwt from 'jsonwebtoken';

export const generateToken = (id,res,role) => {
    const expirationTime = 24*60*60*1000; // 24 hours in milliseconds
    const token = jwt.sign({ id,role }, process.env.JWT_SECRETKEY, {
        expiresIn: '1d'
    })
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: expirationTime, // 1 day 
    });
}