import generateToken from '../../utils/generateToken.js';

const refreshToken = async (req, res, next) => {
  try {
    const newToken = await generateToken(req.userEmail, req.userId);
    res.status(200).json({ token: newToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    next(error);
  }
};

export default refreshToken;
