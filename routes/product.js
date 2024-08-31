const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const upload = require('../middleware/upload');

router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/search', async (req, res) => {
  const { query } = req.query; 
  if (!query) {
    return res.status(400).json({ msg: 'Search query is required' });
  }

  try {

    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });

    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Product not found' });
    res.status(500).send('Server Error');
  }
});

router.post(
  '/',
  [auth, admin, upload.single('image')],
  async (req, res) => {
    const { name, description, price, countInStock } = req.body;
    const imageUrl = req.file ? req.file.path : '';

    try {
      const newProduct = new Product({ name, description, price, countInStock, imageUrl });
      const product = await newProduct.save();
      res.json(product);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

router.post('/like/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ msg: 'Product not found' });

    if (user.likedProducts.includes(product._id)) {
      return res.status(400).json({ msg: 'Product already liked' });
    }

    user.likedProducts.push(product._id);
    await user.save();

    res.json(user.likedProducts);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Product not found' });
    res.status(500).send('Server Error');
  }
});

router.post('/unlike/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ msg: 'Product not found' });

    const removeIndex = user.likedProducts.indexOf(product._id);
    if (removeIndex === -1) {
      return res.status(400).json({ msg: 'Product has not been liked' });
    }

    user.likedProducts.splice(removeIndex, 1);
    await user.save();

    res.json(user.likedProducts);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Product not found' });
    res.status(500).send('Server Error');
  }
});

router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    await product.remove();
    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
