const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get Cart Details
router.get('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) return res.status(404).json({ msg: 'Cart not found' });
    res.json(cart);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add Item to Cart
router.post(
  '/',
  [
    auth,
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, quantity } = req.body;

    try {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ msg: 'Product not found' });

      let cart = await Cart.findOne({ user: req.user.id });
      if (!cart) {
        cart = new Cart({
          user: req.user.id,
          items: [{ product: productId, quantity }],
        });
        await cart.save();
        await User.findByIdAndUpdate(req.user.id, { cart: cart._id });
      } else {
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex > -1) {
          cart.items[itemIndex].quantity += quantity;
        } else {
          cart.items.push({ product: productId, quantity });
        }
        await cart.save();
      }

      res.json(cart);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// Update Cart Item Quantity
router.put(
  '/:productId',
  [
    auth,
    body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
  ],
  async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const cart = await Cart.findOne({ user: req.user.id });
      if (!cart) return res.status(404).json({ msg: 'Cart not found' });

      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
      if (itemIndex === -1) return res.status(404).json({ msg: 'Item not found in cart' });

      cart.items[itemIndex].quantity = quantity;
      await cart.save();

      res.json(cart);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// Remove Item from Cart
router.delete('/:productId', auth, async (req, res) => {
  const { productId } = req.params;

  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ msg: 'Cart not found' });

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();

    res.json(cart);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Clear Cart
router.delete('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOneAndDelete({ user: req.user.id });
    if (!cart) return res.status(404).json({ msg: 'Cart not found' });

    await User.findByIdAndUpdate(req.user.id, { cart: null });

    res.json({ msg: 'Cart cleared' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
