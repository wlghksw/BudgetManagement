import express from 'express';
import {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetsByMonth,
  createBudgetsFromSalary
} from '../controllers/budgets.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getBudgets);
router.get('/month', getBudgetsByMonth);
router.post('/from-salary', createBudgetsFromSalary);
router.get('/:id', getBudget);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;


