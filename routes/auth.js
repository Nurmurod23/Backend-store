const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Cart = require('../models/Cart');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const upload = require('../middleware/upload'); // Assuming you have an upload.js middleware for multer

// Register a new user
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('isAdmin').optional().isBoolean().withMessage('Invalid admin status'),
    body('avatarUrl').optional().isURL().withMessage('Invalid avatar URL') // Validate URL format
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, isAdmin, avatarUrl } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ msg: 'User already exists' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({ name, email, password: hashedPassword, isAdmin, avatarUrl });

      const cart = new Cart({ user: user._id, items: [] });
      await cart.save();
      user.cart = cart._id;
      await user.save();

      const payload = { user: { id: user.id, isAdmin: user.isAdmin } };

      jwt.sign(payload, 'process.env.JWT_SECRET', { expiresIn: '1h' }, (err, token) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Server error');
        }
        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Login a user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

      const payload = { user: { id: user.id, isAdmin: user.isAdmin } };

      jwt.sign(payload, 'process.env.JWT_SECRET', { expiresIn: '1h' }, (err, token) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Server error');
        }
        res.json({ token });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// Get current user's profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('cart');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update user's profile
router.put(
  '/me',
  auth,
  upload.single('avatar'), // Multer middleware for avatar upload
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Invalid email address'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {
      let user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ msg: 'User not found' });

      if (name) user.name = name;
      if (email) user.email = email;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }
      if (avatarUrl) user.avatarUrl = avatarUrl;

      await user.save();
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);


router.delete('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);

    if(!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.status(200).json({ msg: 'User deleted succesfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
})

module.exports = router;
