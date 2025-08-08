import express from 'express';
import userRouter from './modules/user/user.router.js';
import productRouter from './modules/product/product.router.js';
import categoryRouter from './modules/category/category.router.js';

const routerV1 = express.Router();

routerV1.use('/user', userRouter);

routerV1.use('/products', productRouter);

routerV1.use('/categories', categoryRouter);

export default routerV1;
