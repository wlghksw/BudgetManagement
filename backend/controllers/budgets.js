import Budget from '../models/Budget.js';
import Category from '../models/Category.js';

export const getBudgets = async (req, res) => {
  try {
    const userId = req.user._id;
    const budgets = await Budget.find({ userId })
      .populate('categoryId', 'name icon color')
      .sort({ year: -1, month: -1 });

    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('categoryId', 'name icon color');

    if (!budget) {
      return res.status(404).json({ error: '예산을 찾을 수 없습니다.' });
    }

    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBudget = async (req, res) => {
  try {
    const { categoryId, amount, month, year } = req.body;
    const userId = req.user._id;

    // 카테고리 확인
    const category = await Category.findOne({ _id: categoryId, userId });
    if (!category) {
      return res.status(404).json({ error: '카테고리를 찾을 수 없습니다.' });
    }

    // 지출 카테고리만 예산 설정 가능
    if (category.type !== 'expense') {
      return res.status(400).json({ error: '지출 카테고리에만 예산을 설정할 수 있습니다.' });
    }

    const budget = new Budget({
      userId,
      categoryId,
      amount,
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear()
    });

    await budget.save();
    await budget.updateSpent();
    await budget.populate('categoryId', 'name icon color');

    res.status(201).json({
      message: '예산이 설정되었습니다.',
      budget
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: '해당 월의 예산이 이미 설정되어 있습니다.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { amount } = req.body;
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!budget) {
      return res.status(404).json({ error: '예산을 찾을 수 없습니다.' });
    }

    if (amount !== undefined) {
      budget.amount = amount;
    }

    await budget.save();
    await budget.updateSpent();
    await budget.populate('categoryId', 'name icon color');

    res.json({
      message: '예산이 수정되었습니다.',
      budget
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!budget) {
      return res.status(404).json({ error: '예산을 찾을 수 없습니다.' });
    }

    await Budget.deleteOne({ _id: budget._id });
    res.json({ message: '예산이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBudgetsByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.user._id;

    if (!month || !year) {
      return res.status(400).json({ error: '월과 연도가 필요합니다.' });
    }

    const budgets = await Budget.find({
      userId,
      month: parseInt(month),
      year: parseInt(year)
    })
      .populate('categoryId', 'name icon color')
      .sort({ amount: -1 });

    // spent 값 업데이트
    for (const budget of budgets) {
      await budget.updateSpent();
    }

    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


