import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }

    req.userEmail = decoded.email;
    req.userId = decoded.userId;
    next(); // Proceed to the next middleware or route handler
  });
};

export default verifyToken;
