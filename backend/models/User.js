import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  avatarUrl: {
    type: String,
    default: null
  },
  currency: {
    type: String,
    default: 'KRW',
    enum: ['KRW', 'USD', 'EUR', 'JPY']
  },
  language: {
    type: String,
    default: 'ko',
    enum: ['ko', 'en']
  },
  notificationSettings: {
    budgetAlert: {
      type: Boolean,
      default: true
    },
    budgetThreshold: {
      type: Number,
      default: 80 // 80% 도달시 알림
    }
  },
  salary: {
    type: Number,
    default: null // 실수령액
  },
  budgetAllocation: {
    // 월급에서 각 카테고리별 분배 비율 (%)
    savings: {
      type: Number,
      default: 20 // 적금 20%
    },
    insurance: {
      type: Number,
      default: 10 // 보험 10%
    },
    living: {
      type: Number,
      default: 15 // 생활비 15%
    },
    food: {
      type: Number,
      default: 25 // 식비 25%
    },
    transportation: {
      type: Number,
      default: 8 // 교통비 8%
    },
    shopping: {
      type: Number,
      default: 10 // 쇼핑 10%
    },
    culture: {
      type: Number,
      default: 7 // 문화/여가 7%
    },
    other: {
      type: Number,
      default: 5 // 기타 5%
    }
  }
}, {
  timestamps: true
});

// 비밀번호 해싱
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 비밀번호 검증 메서드
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);


