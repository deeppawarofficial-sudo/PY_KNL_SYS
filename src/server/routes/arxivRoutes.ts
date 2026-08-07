import { Router } from 'express';
import { searchArxiv, importArxivPaper, searchSemanticScholar } from '../controllers/arxivController.js';

const router = Router();

router.post('/arxiv/search', searchArxiv);
router.post('/arxiv/import', importArxivPaper);
router.post('/semanticscholar/search', searchSemanticScholar);

export default router;

