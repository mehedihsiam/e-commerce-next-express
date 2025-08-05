import express from 'express';
import registerUserSelf from './registerUserSelf.js';
import verifyToken from '../../middlewares/verifyToken.js';
import createModerator from './createModerator.js';
import verifyAdmin from '../../middlewares/verifyAdmin.js';
import loginUser from './loginUser.js';
import refreshToken from './refreshToken.js';
import deleteModerator from './deleteModerator.js';
import getMyProfile from './getMyProfile.js';
import restoreModerator from './restoreModerator.js';
import changePassword from './changePassword.js';
import forgetPassword from './forgetPassword.js';
import verifyOtp from './verifyOtp.js';
import allCustomers from './allCustomers.js';
import allModerators from './allModerators.js';
import verifyAdminOrModerator from '../../middlewares/verifyAdminOrModerator.js';
const userRouter = express.Router();

userRouter.post('/register-self', registerUserSelf);

userRouter.post('/login', loginUser);

userRouter.post('/create-moderator', verifyAdmin, createModerator);

userRouter.get('/refresh-token', verifyToken, refreshToken);

userRouter.patch('/delete-moderator', verifyAdmin, deleteModerator);

userRouter.patch('/restore-moderator', verifyAdmin, restoreModerator);

userRouter.put('/change-password', verifyToken, changePassword);

userRouter.post('/forget-password', forgetPassword);

userRouter.post('/verify-otp', verifyOtp);

userRouter.get('/me', verifyToken, getMyProfile);

userRouter.get('/all-customers', verifyAdminOrModerator, allCustomers);

userRouter.get('/all-moderators', verifyAdmin, allModerators);

export default userRouter;
