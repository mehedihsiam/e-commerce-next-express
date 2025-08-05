import express from "express";
import userRouter from "./modules/user/user.router.js";

const routerV1 = express.Router();

routerV1.use("/user", userRouter);

export default routerV1;
