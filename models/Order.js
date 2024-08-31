const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  qty: { 
    type: Number, 
    required: true,
    min: [1, 'Quantity must be at least 1'] 
  },
  image: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: [0, 'Price must be a positive number'] 
  },
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'Product' 
  }
}, { _id: false }); 

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },
  orderItems: [orderItemSchema], 
  shippingAddress: {
    address: { 
      type: String, 
      required: true 
    },
    city: { 
      type: String, 
      required: true 
    },
    postalCode: { 
      type: String, 
      required: true 
    },
    country: { 
      type: String, 
      required: true 
    },
  },
  paymentMethod: { 
    type: String, 
    required: true 
  },
  paymentResult: {
    id: { 
      type: String 
    },
    status: { 
      type: String 
    },
    update_time: { 
      type: String 
    },
    email_address: { 
      type: String 
    }
  },
  taxPrice: { 
    type: Number, 
    required: true, 
    default: 0.0,
    min: [0, 'Tax price must be a positive number'] 
  },
  shippingPrice: { 
    type: Number, 
    required: true, 
    default: 0.0,
    min: [0, 'Shipping price must be a positive number'] 
  },
  totalPrice: { 
    type: Number, 
    required: true, 
    default: 0.0,
    min: [0, 'Total price must be a positive number']
  },
  isPaid: { 
    type: Boolean, 
    required: true, 
    default: false 
  },
  paidAt: { 
    type: Date 
  },
  isDelivered: { 
    type: Boolean, 
    required: true, 
    default: false 
  },
  deliveredAt: { 
    type: Date 
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
