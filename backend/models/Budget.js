import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
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
  spent: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// 사용자별 월별 카테고리 예산 중복 방지
budgetSchema.index({ userId: 1, categoryId: 1, year: 1, month: 1 }, { unique: true });

// spent 자동 계산 메서드
budgetSchema.methods.updateSpent = async function() {
  const Transaction = mongoose.model('Transaction');
  const startDate = new Date(this.year, this.month - 1, 1);
  const endDate = new Date(this.year, this.month, 0, 23, 59, 59);
  
  const totalSpent = await Transaction.aggregate([
    {
      $match: {
        userId: this.userId,
        categoryId: this.categoryId,
        type: 'expense',
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  this.spent = totalSpent[0]?.total || 0;
  await this.save();
  return this.spent;
};

export default mongoose.model('Budget', budgetSchema);


