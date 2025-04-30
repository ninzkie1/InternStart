const mongoose = require('mongoose');

const internLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timeIn: {
    type: Date,
    required: true
  },
  timeOut: {
    type: Date,
    default: null
  },
  totalHours: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['ongoing', 'completed'],
    default: 'ongoing'
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InternLog', internLogSchema); 