import Category from '../models/Category.js';

const defaultCategories = [
  // 지출 카테고리
  { name: '식비', type: 'expense', icon: '🍽️', color: '#ef4444', isDefault: true },
  { name: '교통비', type: 'expense', icon: '🚗', color: '#3b82f6', isDefault: true },
  { name: '쇼핑', type: 'expense', icon: '🛍️', color: '#8b5cf6', isDefault: true },
  { name: '의료/건강', type: 'expense', icon: '🏥', color: '#10b981', isDefault: true },
  { name: '교육', type: 'expense', icon: '📚', color: '#f59e0b', isDefault: true },
  { name: '문화/여가', type: 'expense', icon: '🎬', color: '#ec4899', isDefault: true },
  { name: '주거/통신', type: 'expense', icon: '🏠', color: '#6366f1', isDefault: true },
  { name: '기타', type: 'expense', icon: '📦', color: '#6b7280', isDefault: true },
  // 수입 카테고리
  { name: '급여', type: 'income', icon: '💰', color: '#10b981', isDefault: true },
  { name: '부수입', type: 'income', icon: '💵', color: '#3b82f6', isDefault: true },
  { name: '투자수익', type: 'income', icon: '📈', color: '#8b5cf6', isDefault: true },
  { name: '기타', type: 'income', icon: '💸', color: '#6b7280', isDefault: true }
];

export const getCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const userId = req.user._id;

    const query = { userId };
    if (type) query.type = type;

    const categories = await Category.find(query).sort({ isDefault: -1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!category) {
      return res.status(404).json({ error: '카테고리를 찾을 수 없습니다.' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    const userId = req.user._id;

    const category = new Category({
      userId,
      name,
      type,
      icon: icon || '💰',
      color: color || '#6366f1'
    });

    await category.save();
    res.status(201).json({
      message: '카테고리가 생성되었습니다.',
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: '이미 존재하는 카테고리입니다.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!category) {
      return res.status(404).json({ error: '카테고리를 찾을 수 없습니다.' });
    }

    if (name) category.name = name;
    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();
    res.json({
      message: '카테고리가 수정되었습니다.',
      category
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!category) {
      return res.status(404).json({ error: '카테고리를 찾을 수 없습니다.' });
    }

    if (category.isDefault) {
      return res.status(400).json({ error: '기본 카테고리는 삭제할 수 없습니다.' });
    }

    await Category.deleteOne({ _id: category._id });
    res.json({ message: '카테고리가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createDefaultCategories = async (req, res) => {
  try {
    const userId = req.user._id;

    // 기존 기본 카테고리 확인
    const existingCategories = await Category.find({ userId, isDefault: true });
    if (existingCategories.length > 0) {
      return res.json({
        message: '기본 카테고리가 이미 생성되어 있습니다.',
        categories: existingCategories
      });
    }

    // 기본 카테고리 생성
    const categories = defaultCategories.map(cat => ({
      ...cat,
      userId
    }));

    const createdCategories = await Category.insertMany(categories);

    res.status(201).json({
      message: '기본 카테고리가 생성되었습니다.',
      categories: createdCategories
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


