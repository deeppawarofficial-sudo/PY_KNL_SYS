import { Router } from 'express';
import { getKnowledgeGraph } from '../controllers/knowledgeGraphController.js';

const router = Router();

router.get('/knowledge-graph', getKnowledgeGraph);

export default router;
