const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  tags: {
    type: [String], // <-- Yeh array of strings hai
    default: []     // <-- Agar na mile toh empty array
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
