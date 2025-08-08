import express from 'express';
import userRouter from './modules/user/user.router.js';
import productRouter from './modules/product/product.router.js';
import categoryRouter from './modules/category/category.router.js';
import cartRouter from './modules/cart/cart.router.js';
import orderRouter from './modules/order/order.router.js';

const routerV1 = express.Router();

routerV1.use('/user', userRouter);

routerV1.use('/products', productRouter);

routerV1.use('/categories', categoryRouter);

routerV1.use('/cart', cartRouter);

routerV1.use('/orders', orderRouter);

export default routerV1;
