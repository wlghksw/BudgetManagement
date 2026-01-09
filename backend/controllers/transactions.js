import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';

export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, categoryId, startDate, endDate } = req.query;
    const userId = req.user._id;

    const query = { userId };
    if (type) query.type = type;
    if (categoryId) query.categoryId = categoryId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('categoryId', 'name icon color')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('categoryId', 'name icon color');

    if (!transaction) {
      return res.status(404).json({ error: '거래 내역을 찾을 수 없습니다.' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { amount, type, categoryId, description, date } = req.body;
    const userId = req.user._id;

    const transaction = new Transaction({
      userId,
      amount,
      type,
      categoryId,
      description,
      date: date ? new Date(date) : new Date()
    });

    await transaction.save();
    await transaction.populate('categoryId', 'name icon color');

    // 예산 업데이트 (지출인 경우)
    if (type === 'expense') {
      const transactionDate = new Date(date || Date.now());
      const budget = await Budget.findOne({
        userId,
        categoryId,
        year: transactionDate.getFullYear(),
        month: transactionDate.getMonth() + 1
      });

      if (budget) {
        await budget.updateSpent();
      }
    }

    res.status(201).json({
      message: '거래 내역이 추가되었습니다.',
      transaction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { amount, type, categoryId, description, date } = req.body;
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ error: '거래 내역을 찾을 수 없습니다.' });
    }

    const oldType = transaction.type;
    const oldCategoryId = transaction.categoryId;
    const oldDate = transaction.date;

    transaction.amount = amount ?? transaction.amount;
    transaction.type = type ?? transaction.type;
    transaction.categoryId = categoryId ?? transaction.categoryId;
    transaction.description = description ?? transaction.description;
    transaction.date = date ? new Date(date) : transaction.date;

    await transaction.save();
    await transaction.populate('categoryId', 'name icon color');

    // 예산 업데이트
    if (oldType === 'expense' || transaction.type === 'expense') {
      const dates = [oldDate, transaction.date];
      const categoryIds = [oldCategoryId, transaction.categoryId];

      for (const date of dates) {
        for (const catId of categoryIds) {
          const budget = await Budget.findOne({
            userId: req.user._id,
            categoryId: catId,
            year: date.getFullYear(),
            month: date.getMonth() + 1
          });

          if (budget) {
            await budget.updateSpent();
          }
        }
      }
    }

    res.json({
      message: '거래 내역이 수정되었습니다.',
      transaction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ error: '거래 내역을 찾을 수 없습니다.' });
    }

    const categoryId = transaction.categoryId;
    const date = transaction.date;

    await Transaction.deleteOne({ _id: transaction._id });

    // 예산 업데이트
    if (transaction.type === 'expense') {
      const budget = await Budget.findOne({
        userId: req.user._id,
        categoryId,
        year: date.getFullYear(),
        month: date.getMonth() + 1
      });

      if (budget) {
        await budget.updateSpent();
      }
    }

    res.json({ message: '거래 내역이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAllTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 사용자의 모든 거래 내역 삭제
    const result = await Transaction.deleteMany({ userId });
    
    // 예산의 spent 금액도 초기화
    await Budget.updateMany(
      { userId },
      { $set: { spent: 0 } }
    );

    res.json({ 
      message: `모든 거래 내역(${result.deletedCount}건)이 삭제되었습니다.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTransactionsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: '시작일과 종료일이 필요합니다.' });
    }

    const transactions = await Transaction.find({
      userId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
      .populate('categoryId', 'name icon color')
      .sort({ date: -1 });

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // 총 수입/지출
    const incomeStats = await Transaction.aggregate([
      { $match: { userId, type: 'income', ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const expenseStats = await Transaction.aggregate([
      { $match: { userId, type: 'expense', ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // 카테고리별 지출 통계
    const categoryStats = await Transaction.aggregate([
      { $match: { userId, type: 'expense', ...dateFilter } },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    // 카테고리 정보 추가
    const Category = (await import('../models/Category.js')).default;
    const categoryIds = categoryStats.map(s => s._id);
    const categories = await Category.find({ _id: { $in: categoryIds } });
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat._id.toString()] = cat;
    });

    const categoryBreakdown = categoryStats.map(stat => ({
      categoryId: stat._id,
      categoryName: categoryMap[stat._id.toString()]?.name || 'Unknown',
      icon: categoryMap[stat._id.toString()]?.icon || '💰',
      color: categoryMap[stat._id.toString()]?.color || '#6366f1',
      total: stat.total,
      count: stat.count
    }));

    const totalIncome = incomeStats[0]?.total || 0;
    const totalExpense = expenseStats[0]?.total || 0;
    const balance = totalIncome - totalExpense;

    // 전체 지출 대비 비율 계산
    categoryBreakdown.forEach(item => {
      item.percentage = totalExpense > 0 ? (item.total / totalExpense * 100).toFixed(1) : 0;
    });

    res.json({
      totalIncome,
      totalExpense,
      balance,
      incomeCount: incomeStats[0]?.count || 0,
      expenseCount: expenseStats[0]?.count || 0,
      categoryBreakdown
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

