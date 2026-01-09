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
  // 해당 월의 첫날 00:00:00부터 마지막날 23:59:59까지
  const startDate = new Date(this.year, this.month - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(this.year, this.month, 0, 23, 59, 59, 999);
  
  console.log(`[Budget.updateSpent] 예산 ID: ${this._id}, 카테고리: ${this.categoryId}, 기간: ${startDate.toISOString()} ~ ${endDate.toISOString()}`);
  
  // categoryId를 ObjectId로 확실히 변환
  const categoryObjectId = mongoose.Types.ObjectId.isValid(this.categoryId) 
    ? new mongoose.Types.ObjectId(this.categoryId)
    : this.categoryId;
  
  const totalSpent = await Transaction.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId.isValid(this.userId) 
          ? new mongoose.Types.ObjectId(this.userId)
          : this.userId,
        categoryId: categoryObjectId,
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
  
  const newSpent = totalSpent[0]?.total || 0;
  const oldSpent = this.spent;
  this.spent = newSpent;
  await this.save();
  
  // 디버깅 로그
  const categoryName = this.populated('categoryId')?.name || this.categoryId;
  console.log(`[Budget.updateSpent] ${this.year}년 ${this.month}월 카테고리 ${categoryName}: spent ${oldSpent} → ${newSpent}원 (예산: ${this.amount.toLocaleString()}원)`);
  
  // 매칭된 거래 수 확인
  const transactionCount = await Transaction.countDocuments({
    userId: mongoose.Types.ObjectId.isValid(this.userId) 
      ? new mongoose.Types.ObjectId(this.userId)
      : this.userId,
    categoryId: categoryObjectId,
    type: 'expense',
    date: { $gte: startDate, $lte: endDate }
  });
  console.log(`[Budget.updateSpent] 매칭된 거래 수: ${transactionCount}건`);
  
  // 매칭된 거래가 있으면 샘플 로깅
  if (transactionCount > 0 && transactionCount <= 5) {
    const sampleTransactions = await Transaction.find({
      userId: mongoose.Types.ObjectId.isValid(this.userId) 
        ? new mongoose.Types.ObjectId(this.userId)
        : this.userId,
      categoryId: categoryObjectId,
      type: 'expense',
      date: { $gte: startDate, $lte: endDate }
    }).limit(3).select('description amount date');
    console.log(`[Budget.updateSpent] 샘플 거래:`, sampleTransactions.map(t => `${t.description}: ${t.amount}원 (${t.date.toISOString()})`).join(', '));
  }
  
  return this.spent;
};

export default mongoose.model('Budget', budgetSchema);


