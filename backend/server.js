import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import transactionRoutes from './routes/transactions.js';
import categoryRoutes from './routes/categories.js';
import budgetRoutes from './routes/budgets.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결 설정
const mongoOptions = {
  serverSelectionTimeoutMS: 5000, // 5초 타임아웃
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/budget-app', mongoOptions)
  .then(() => {
    console.log('✅ MongoDB 연결 성공');
    console.log(`   데이터베이스: ${mongoose.connection.name}`);
  })
  .catch(err => {
    console.error('❌ MongoDB 연결 실패:', err.message);
    console.log('');
    console.log('⚠️  MongoDB 연결 문제 해결 방법:');
    console.log('   1. 로컬 MongoDB 사용 시: mongod 명령어로 MongoDB 서버 시작');
    console.log('   2. MongoDB Atlas 사용 시: .env 파일의 MONGODB_URI 확인');
    console.log('   3. MongoDB가 설치되어 있지 않은 경우:');
    console.log('      - Homebrew: brew install mongodb-community');
    console.log('      - 또는 MongoDB Atlas (무료): https://www.mongodb.com/cloud/atlas');
    console.log('');
    // 서버는 계속 실행하되, MongoDB 없이는 API가 작동하지 않음을 알림
  });

// Routes
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '서버가 정상 작동 중입니다.' });
});

app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
});

