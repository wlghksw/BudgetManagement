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

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    console.log(`[getBudgetsByMonth] 요청: userId=${userId}, year=${yearNum}, month=${monthNum}`);

    const budgets = await Budget.find({
      userId,
      month: monthNum,
      year: yearNum
    })
      .populate('categoryId', 'name icon color')
      .sort({ amount: -1 });

    console.log(`[getBudgetsByMonth] 찾은 예산 수: ${budgets.length}개`);

    // spent 값 업데이트
    for (const budget of budgets) {
      await budget.updateSpent();
    }

    console.log(`[getBudgetsByMonth] 응답: ${budgets.length}개 예산 반환`);
    res.json(budgets);
  } catch (error) {
    console.error('[getBudgetsByMonth] 에러:', error);
    res.status(500).json({ error: error.message });
  }
};

// 월급 기반 자동 예산 생성
export const createBudgetsFromSalary = async (req, res) => {
  try {
    const { month, year } = req.body;
    const userId = req.user._id;
    const User = (await import('../models/User.js')).default;

    // 사용자 정보 조회
    const user = await User.findById(userId);
    if (!user || !user.salary) {
      return res.status(400).json({ error: '월급이 설정되지 않았습니다. 프로필에서 월급을 먼저 설정해주세요.' });
    }

    const monthNum = month || new Date().getMonth() + 1;
    const yearNum = year || new Date().getFullYear();

    // 카테고리 이름과 분배 키 매핑
    const categoryMapping = {
      '적금': 'savings',
      '보험': 'insurance',
      '주거/통신': 'living',
      '식비': 'food',
      '교통비': 'transportation',
      '쇼핑': 'shopping',
      '문화/여가': 'culture',
      '기타': 'other'
    };

    const allocation = user.budgetAllocation || {
      savings: 20,
      insurance: 10,
      living: 15,
      food: 25,
      transportation: 8,
      shopping: 10,
      culture: 7,
      other: 5
    };

    // 비율 합계 확인
    const totalPercentage = Object.values(allocation).reduce((sum, val) => sum + val, 0);
    if (Math.abs(totalPercentage - 100) > 1) {
      return res.status(400).json({ 
        error: `예산 분배 비율의 합이 100%가 아닙니다. (현재: ${totalPercentage}%)` 
      });
    }

    const createdBudgets = [];
    const updatedBudgets = [];

    // 각 카테고리별로 예산 생성/업데이트
    for (const [categoryName, allocationKey] of Object.entries(categoryMapping)) {
      const category = await Category.findOne({ 
        userId, 
        name: categoryName, 
        type: 'expense' 
      });

      if (!category) {
        console.log(`[월급 기반 예산 생성] 카테고리 "${categoryName}"를 찾을 수 없습니다. 건너뜁니다.`);
        continue;
      }

      const percentage = allocation[allocationKey] || 0;
      const amount = Math.round((user.salary * percentage) / 100);

      if (amount <= 0) continue;

      // 기존 예산 확인
      let budget = await Budget.findOne({
        userId,
        categoryId: category._id,
        month: monthNum,
        year: yearNum
      });

      if (budget) {
        // 기존 예산 업데이트
        budget.amount = amount;
        await budget.save();
        await budget.updateSpent();
        await budget.populate('categoryId', 'name icon color');
        updatedBudgets.push(budget);
        console.log(`[월급 기반 예산 생성] ${categoryName}: ${amount.toLocaleString()}원 (업데이트)`);
      } else {
        // 새 예산 생성
        budget = new Budget({
          userId,
          categoryId: category._id,
          amount,
          month: monthNum,
          year: yearNum
        });
        await budget.save();
        await budget.updateSpent();
        await budget.populate('categoryId', 'name icon color');
        createdBudgets.push(budget);
        console.log(`[월급 기반 예산 생성] ${categoryName}: ${amount.toLocaleString()}원 (생성)`);
      }
    }

    res.status(201).json({
      message: `월급 ${user.salary.toLocaleString()}원 기준으로 ${createdBudgets.length}개 예산이 생성되고 ${updatedBudgets.length}개 예산이 업데이트되었습니다.`,
      created: createdBudgets.length,
      updated: updatedBudgets.length,
      budgets: [...createdBudgets, ...updatedBudgets]
    });
  } catch (error) {
    console.error('[월급 기반 예산 생성] 에러:', error);
    res.status(500).json({ error: error.message });
  }
};


