const mongoose = require('mongoose');

const publicTaskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true }, // Ensure unique for reference
  topic: { type: String, required: true },
  documentPath: { type: String },
  wordCount: { type: Number, required: true },
  estimatedQuote: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PublicTask', publicTaskSchema);
