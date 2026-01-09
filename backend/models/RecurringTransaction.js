import mongoose from 'mongoose';

const recurringTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6 // 0 = Sunday, 6 = Saturday
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastProcessed: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('RecurringTransaction', recurringTransactionSchema);


