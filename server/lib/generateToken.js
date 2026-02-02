import jwt from 'jsonwebtoken';

export const generateToken = (id, res, role) => {
    const expirationTime = 24*60*60*1000; // 24 hours in milliseconds
    
    const token = jwt.sign({ id, role }, process.env.JWT_SECRETKEY, {
        expiresIn: '1d'
    });
    
    // Cookie options based on environment
    const cookieOptions = {
        httpOnly: true,
        maxAge: expirationTime, // 1 day
    };
    
    // Add production-specific settings
    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
        cookieOptions.sameSite = 'none';
    } else {
        cookieOptions.secure = false;
        cookieOptions.sameSite = 'lax';
    }
    
    res.cookie('token', token, cookieOptions);
};