const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    trim: true
  },

  subject: {
    type: String,
    required: true,
    enum: ["general", "suggestion", "support", "feedback", "other"]
  },

  message: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const contactUs = mongoose.model('contact_us',contactSchema );
module.exports =contactUs;
