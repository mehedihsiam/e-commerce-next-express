import express from 'express';
import verifyToken from '../../middlewares/verifyToken.js';

// Import cart controllers
import addToCart from './addToCart.js';
import getCart from './getCart.js';
import updateCartItem from './updateCartItem.js';
import removeFromCart from './removeFromCart.js';
import clearCart from './clearCart.js';
import getCartSummary from './getCartSummary.js';
import validateCart from './validateCart.js';

const cartRouter = express.Router();

// All cart routes require authentication
cartRouter.use(verifyToken);

// Cart management routes
cartRouter.get('/', getCart); // GET /cart - Get user's cart
cartRouter.get('/summary', getCartSummary); // GET /cart/summary - Get cart summary only
cartRouter.get('/validate', validateCart); // GET /cart/validate - Validate cart items
cartRouter.post('/add', addToCart); // POST /cart/add - Add item to cart
cartRouter.put('/items/:itemId', updateCartItem); // PUT /cart/items/:itemId - Update cart item quantity
cartRouter.delete('/items/:itemId', removeFromCart); // DELETE /cart/items/:itemId - Remove item from cart
cartRouter.delete('/clear', clearCart); // DELETE /cart/clear - Clear entire cart

export default cartRouter;
