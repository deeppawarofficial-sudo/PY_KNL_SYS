import { Router } from 'express';
import { searchRag, synthesizeRag, generateLiteratureReview, getComparisonMatrix } from '../controllers/ragController.js';

const router = Router();

router.post('/rag/search', searchRag);
router.post('/rag/synthesize', synthesizeRag);
router.post('/rag/generate-review', generateLiteratureReview);
router.get('/rag/matrix', getComparisonMatrix);

export default router;

