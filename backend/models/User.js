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


