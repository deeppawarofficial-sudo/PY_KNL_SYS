import { Router } from 'express';
import { searchArxiv, importArxivPaper } from '../controllers/arxivController.js';

const router = Router();

router.post('/arxiv/search', searchArxiv);
router.post('/arxiv/import', importArxivPaper);

export default router;
