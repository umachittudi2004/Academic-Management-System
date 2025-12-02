import requestIp from 'request-ip';
import dotenv from 'dotenv';
dotenv.config();

export const checkIp = (req, res, next) => {
  const clientIp = requestIp.getClientIp(req);
  const collegeIp = process.env.IP_ADDRESS;

  // Normalize IPv6 localhost (::1) to IPv4 localhost (127.0.0.1)
  const normalizedIp = clientIp === '::1' ? '127.0.0.1' : clientIp;

  console.log("clientIp:", normalizedIp);
  console.log("collegeIp:", collegeIp);

  // Allow local development IPs
  const allowedLocalIps = ['127.0.0.1', '::1'];

  // Allow both dev and college IP
  if (![collegeIp, ...allowedLocalIps].includes(normalizedIp)) {
    return res
      .status(403)
      .json({ message: "Access denied. Please connect to the college network." });
  }

  next();
};
