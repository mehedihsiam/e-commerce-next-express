import jwt from 'jsonwebtoken';

const generateToken = async (email, userId) => {
  const newToken = jwt.sign({ email, userId }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
  return newToken;
};

export default generateToken;
