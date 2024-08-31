const mongoose = require('mongoose');
const validator = require('validator');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true, 
    minlength: [1, 'Name cannot be empty'] 
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true, 
    minlength: [1, 'Description cannot be empty'] 
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price must be a positive number'] 
  },
  countInStock: { 
    type: Number, 
    required: [true, 'Stock count is required'],
    min: [0, 'Count in stock cannot be negative'] 
  },
  imageUrl: { 
    type: String, 
    required: [true, 'Image URL is required'],
    trim: true,
    validate: [validator.isURL, 'Invalid URL'] // Validate URL format
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
