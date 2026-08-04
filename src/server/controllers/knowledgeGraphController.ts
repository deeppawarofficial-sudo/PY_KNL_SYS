import { Request, Response } from 'express';
import { papersDatabase } from '../models/paperModel.js';
import { KnowledgeGraphData } from '../../types.js';

export function getKnowledgeGraph(req: Request, res: Response) {
  const nodes = [];
  const links = [];

  const conceptNodes = [
    { id: 'c-graphrag', label: 'GraphRAG', type: 'methodology' as const, description: 'Hierarchical community detection & entity graphs' },
    { id: 'c-trad-rag', label: 'Traditional RAG', type: 'methodology' as const, description: 'Dense vector retrieval & FAISS MIPS' },
    { id: 'c-cot', label: 'Chain-of-Thought (CoT)', type: 'concept' as const, description: 'Intermediate reasoning step decomposition' },
    { id: 'c-rl-reasoning', label: 'RL Reasoning (DeepSeek-R1)', type: 'methodology' as const, description: 'GRPO reinforcement learning without initial SFT' },
    { id: 'c-hnsw', label: 'HNSW Vector Indexing', type: 'concept' as const, description: 'Hierarchical Navigable Small World graph indexing' },
    { id: 'c-hybrid-bm25', label: 'Hybrid Sparse-Dense Search', type: 'methodology' as const, description: 'Reciprocal Rank Fusion of BM25 + Vector embeddings' },
    { id: 'c-cross-encoder', label: 'Cross-Encoder Reranking', type: 'methodology' as const, description: 'Two-stage deep query-document interaction reranking' },
  ];

  nodes.push(...conceptNodes);

  for (const paper of papersDatabase.slice(0, 10)) {
    nodes.push({
      id: paper.id,
      label: paper.title.length > 35 ? paper.title.slice(0, 32) + '...' : paper.title,
      type: 'paper' as const,
      paperId: paper.id,
      description: `Published in ${paper.year} by ${paper.authors[0]} et al.`,
    });
  }

  links.push(
    { source: 'paper-graphrag-2024', target: 'c-graphrag', relationship: 'Proposes' },
    { source: 'paper-graphrag-2024', target: 'c-trad-rag', relationship: 'Compares against' },
    { source: 'paper-traditional-rag-2020', target: 'c-trad-rag', relationship: 'Introduces' },
    { source: 'paper-deepseek-r1-2025', target: 'c-rl-reasoning', relationship: 'Introduces' },
    { source: 'paper-deepseek-r1-2025', target: 'c-cot', relationship: 'Incentivizes' },
    { source: 'paper-chain-of-thought-2022', target: 'c-cot', relationship: 'Elicits' },
    { source: 'paper-qdrant-vector-bench-2024', target: 'c-hnsw', relationship: 'Benchmarks' },
    { source: 'paper-bm25-hybrid-2023', target: 'c-hybrid-bm25', relationship: 'Proposes' },
    { source: 'paper-bm25-hybrid-2023', target: 'c-trad-rag', relationship: 'Enhances' },
    { source: 'paper-reranking-bge-2023', target: 'c-cross-encoder', relationship: 'Evaluates' },
    { source: 'paper-reranking-bge-2023', target: 'c-trad-rag', relationship: 'Optimizes' }
  );

  res.json({ nodes, links } as KnowledgeGraphData);
}
