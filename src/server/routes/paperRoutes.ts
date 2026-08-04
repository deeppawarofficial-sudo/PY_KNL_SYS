import { Router } from 'express';
import {
  getStats,
  getPapers,
  getPaperDetails,
  uploadPaper,
  deletePaper,
  resetResearchSession,
} from '../controllers/paperController.js';

const router = Router();

router.get('/stats', getStats);
router.get('/papers', getPapers);
router.get('/papers/:id', getPaperDetails);
router.post('/upload-paper', uploadPaper);
router.delete('/papers/:id', deletePaper);
router.post('/papers/reset-session', resetResearchSession);

export default router;
