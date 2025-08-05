import { ROLES } from '../constants/ROLES.js';
import User from '../modules/user/User.model.js';
import jwt from 'jsonwebtoken';

const verifyAdmin = async (req, res, next) => {
  const token = req.headers['authorization']?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }
    const user = await User.findOne({ email: decoded.email });
    if (!user || user.role !== ROLES.ADMIN) {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    req.userEmail = decoded.email;
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  });
};

export default verifyAdmin;
