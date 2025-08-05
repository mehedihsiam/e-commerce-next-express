import express from 'express';
import registerUserSelf from './registerUserSelf.js';
import verifyToken from '../../middlewares/verifyToken.js';
import createModerator from './createModerator.js';
import verifyAdmin from '../../middlewares/verifyAdmin.js';
import loginUser from './loginUser.js';
import refreshToken from './refreshToken.js';
const userRouter = express.Router();

userRouter.post('/register-self', registerUserSelf);

userRouter.post('/login', loginUser);

userRouter.post('/create-moderator', verifyAdmin, createModerator);

userRouter.get('/refresh-token', verifyToken, refreshToken);

export default userRouter;
