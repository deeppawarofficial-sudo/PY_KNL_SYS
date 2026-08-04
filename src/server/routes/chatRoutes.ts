import { Router } from 'express';
import { chatWithPaper } from '../controllers/chatController.js';

const router = Router();

router.post('/chat', chatWithPaper);

export default router;
