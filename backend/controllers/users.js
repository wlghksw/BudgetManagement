import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d'
  });
};

export const register = async (req, res) => {
  try {
    const { email, password, name, currency } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: '이미 등록된 이메일입니다.' });
    }

    const user = new User({
      email,
      password,
      name,
      currency: currency || 'KRW'
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        currency: user.currency
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = generateToken(user._id);

    res.json({
      message: '로그인 성공',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        currency: user.currency
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, currency, language, notificationSettings, salary, budgetAllocation } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (currency) user.currency = currency;
    if (language) user.language = language;
    if (notificationSettings) {
      user.notificationSettings = { ...user.notificationSettings, ...notificationSettings };
    }
    if (salary !== undefined) user.salary = salary;
    if (budgetAllocation) {
      user.budgetAllocation = { ...user.budgetAllocation, ...budgetAllocation };
    }

    await user.save();

    res.json({
      message: '프로필이 업데이트되었습니다.',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        currency: user.currency,
        language: user.language,
        notificationSettings: user.notificationSettings,
        salary: user.salary,
        budgetAllocation: user.budgetAllocation
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


