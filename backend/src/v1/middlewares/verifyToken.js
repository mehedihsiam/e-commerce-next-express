import jwt from 'jsonwebtoken';
import User from '../modules/user/User.model.js';

const verifyToken = async (req, res, next) => {
  console.log(req.headers);
  const token = req.headers['authorization']?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }

    const user = await User.findOne({
      _id: decoded.userId,
      email: decoded.email,
      deleted: { $ne: true },
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: User not found or inactive' });
    }

    req.userEmail = decoded.email;
    req.userId = decoded.userId;
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  });
};

export default verifyToken;
