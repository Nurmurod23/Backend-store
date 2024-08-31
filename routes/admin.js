const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { body, validationResult } = require('express-validator');


router.use(auth);
router.use(admin);

router.post(
  '/products',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('countInStock').isInt({ gt: 0 }).withMessage('Count in stock must be a positive integer'),
    body('imageUrl').optional().isURL().withMessage('Invalid image URL') // Validate URL format
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, countInStock, imageUrl } = req.body;

    try {
      const newProduct = new Product({ name, description, price, countInStock, imageUrl });
      const product = await newProduct.save();
      res.status(201).json(product);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

router.put(
  '/products/:id',
  [
    body('name').optional().notEmpty().withMessage('Name is required'),
    body('description').optional().notEmpty().withMessage('Description is required'),
    body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('countInStock').optional().isInt({ gt: 0 }).withMessage('Count in stock must be a positive integer'),
    body('imageUrl').optional().isURL().withMessage('Invalid image URL') // Validate URL format
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, countInStock, imageUrl } = req.body;

    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { name, description, price, countInStock, imageUrl },
        { new: true }
      );
      if (!product) return res.status(404).json({ msg: 'Product not found' });
      res.json(product);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put(
  '/users/:id',
  [
    body('name').optional().notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Invalid email address'),
    body('isAdmin').optional().isBoolean().withMessage('Invalid admin status'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, isAdmin } = req.body;

    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { name, email, isAdmin },
        { new: true }
      );
      if (!user) return res.status(404).json({ msg: 'User not found' });
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email');
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put(
  '/orders/:id',
  [
    body('isPaid').optional().isBoolean().withMessage('Invalid paid status'),
    body('isDelivered').optional().isBoolean().withMessage('Invalid delivered status'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isPaid, isDelivered } = req.body;

    try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ msg: 'Order not found' });

      if (isPaid !== undefined) {
        order.isPaid = isPaid;
        order.paidAt = isPaid ? new Date() : null;
      }

      if (isDelivered !== undefined) {
        order.isDelivered = isDelivered;
        order.deliveredAt = isDelivered ? new Date() : null;
      }

      await order.save();
      res.json(order);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

router.get('/dashboard', async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const userCount = await User.countDocuments();
    const orderCount = await Order.countDocuments();
    const revenue = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.json({
      productCount,
      userCount,
      orderCount,
      revenue: revenue.length ? revenue[0].total : 0,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
