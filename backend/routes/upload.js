import express from 'express';
import multer from 'multer';
import { uploadCSV, uploadExcel, saveUploadedTransactions } from '../controllers/upload.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB 제한
});

router.post('/csv', upload.single('file'), uploadCSV);
router.post('/excel', upload.single('file'), uploadExcel);
router.post('/save', saveUploadedTransactions);

export default router;

