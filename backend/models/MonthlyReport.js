import mongoose from 'mongoose';

const monthlyReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  totalIncome: {
    type: Number,
    default: 0
  },
  totalExpense: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  categoryBreakdown: [{
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    categoryName: String,
    amount: Number,
    percentage: Number
  }],
  topExpenses: [{
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    description: String,
    amount: Number,
    date: Date
  }]
}, {
  timestamps: true
});

// 사용자별 월별 리포트 중복 방지
monthlyReportSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model('MonthlyReport', monthlyReportSchema);


