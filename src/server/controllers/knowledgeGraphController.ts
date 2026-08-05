import { Request, Response } from 'express';
import { getAllPapers } from '../models/paperModel.js';
import { KnowledgeGraphData } from '../../types.js';

export function getKnowledgeGraph(req: Request, res: Response) {
  const currentPapers = getAllPapers();
  const nodes: any[] = [];
  const links: any[] = [];

  const categoryMap = new Map<string, string[]>();

  // Add paper nodes for currently indexed papers ONLY
  for (const paper of currentPapers) {
    const authorStr = Array.isArray(paper.authors) ? paper.authors.join(', ') : (paper.authors || 'Unknown');
    nodes.push({
      id: paper.id,
      label: paper.title.length > 30 ? paper.title.slice(0, 28) + '...' : paper.title,
      type: 'paper' as const,
      paperId: paper.id,
      description: `Published in ${paper.year} by ${authorStr}. Category: ${paper.topicCategory || 'General AI'}. Abstract: ${paper.abstract.slice(0, 150)}...`,
    });

    const category = paper.topicCategory || 'AI & Machine Learning';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(paper.id);
  }

  // Create concept domain nodes dynamically for active categories
  for (const [category, paperIds] of categoryMap.entries()) {
    const categoryNodeId = `concept-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    nodes.push({
      id: categoryNodeId,
      label: category,
      type: 'concept' as const,
      description: `Research domain grouping ${paperIds.length} paper(s) in active repository session`,
    });

    for (const pid of paperIds) {
      links.push({
        source: pid,
        target: categoryNodeId,
        relationship: 'Categorized under',
      });
    }
  }

  // Dynamically extract core methodologies from active paper content
  const methodologyKeywords = [
    { key: 'graph', label: 'GraphRAG & Community Detection', type: 'methodology' as const },
    { key: 'vector', label: 'BAAI/bge-large-en-v1.5 Embedding', type: 'methodology' as const },
    { key: 'rag', label: 'Retrieval-Augmented Generation', type: 'methodology' as const },
    { key: 'reasoning', label: 'Chain-of-Thought & Reasoning', type: 'methodology' as const },
    { key: 'reinforcement', label: 'Reinforcement Learning (GRPO)', type: 'methodology' as const },
  ];

  for (const method of methodologyKeywords) {
    let methodNodeAdded = false;
    const methodNodeId = `method-${method.key}`;

    for (const paper of currentPapers) {
      const textToSearch = `${paper.title} ${paper.abstract}`.toLowerCase();
      if (textToSearch.includes(method.key)) {
        if (!methodNodeAdded) {
          nodes.push({
            id: methodNodeId,
            label: method.label,
            type: method.type,
            description: `Core methodology identified across indexed papers`,
          });
          methodNodeAdded = true;
        }

        links.push({
          source: paper.id,
          target: methodNodeId,
          relationship: 'Proposes / Applies',
        });
      }
    }
  }

  res.json({ nodes, links } as KnowledgeGraphData);
}
