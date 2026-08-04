import { Router } from 'express';
import paperRoutes from './paperRoutes.js';
import arxivRoutes from './arxivRoutes.js';
import ragRoutes from './ragRoutes.js';
import chatRoutes from './chatRoutes.js';
import knowledgeGraphRoutes from './knowledgeGraphRoutes.js';

const apiRouter = Router();

// Health Check Endpoint
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Mount MVC Routes
apiRouter.use(paperRoutes);
apiRouter.use(arxivRoutes);
apiRouter.use(ragRoutes);
apiRouter.use(chatRoutes);
apiRouter.use(knowledgeGraphRoutes);

export default apiRouter;
