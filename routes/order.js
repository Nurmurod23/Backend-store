const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Create a new order
router.post(
  '/',
  [
    auth,
    body('orderItems').isArray().withMessage('Order items are required'),
    body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required'),
    body('taxPrice').isDecimal().withMessage('Invalid tax price'),
    body('shippingPrice').isDecimal().withMessage('Invalid shipping price'),
    body('totalPrice').isDecimal().withMessage('Invalid total price'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderItems, shippingAddress, paymentMethod, taxPrice, shippingPrice, totalPrice } = req.body;

    try {
      const newOrder = new Order({
        user: req.user.id,
        orderItems,
        shippingAddress,
        paymentMethod,
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      const order = await newOrder.save();
      res.status(201).json(order);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// Get all orders for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id });
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get a specific order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Order not found' });
    res.status(500).send('Server Error');
  }
});

// Search orders
router.get('/search', auth, async (req, res) => {
  const { query } = req.query; // Get the search query from query params

  if (!query) {
    return res.status(400).json({ msg: 'Search query is required' });
  }

  try {
    // Perform a case-insensitive search on order items and shipping address
    const orders = await Order.find({
      user: req.user.id,
      $or: [
        { 'orderItems.product': { $regex: query, $options: 'i' } },
        { shippingAddress: { $regex: query, $options: 'i' } },
        { paymentMethod: { $regex: query, $options: 'i' } }
      ]
    });

    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
