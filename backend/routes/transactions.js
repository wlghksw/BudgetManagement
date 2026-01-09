import express from 'express';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  deleteAllTransactions,
  getTransactionsByDateRange,
  getStatistics
} from '../controllers/transactions.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate); // 모든 라우트에 인증 필요

router.get('/', getTransactions);
router.get('/stats', getStatistics);
router.get('/range', getTransactionsByDateRange);
router.get('/:id', getTransaction);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/all', deleteAllTransactions); // 전체 삭제는 /all 경로로
router.delete('/:id', deleteTransaction);

export default router;

