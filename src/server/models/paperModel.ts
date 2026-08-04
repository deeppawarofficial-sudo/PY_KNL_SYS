import { Paper, PaperChunk } from '../../types.js';
import { PRESET_PAPERS, PRESET_CHUNKS } from '../../data/presetPapers.js';

// In-Memory Vector & Metadata Database Collections
export let papersDatabase: Paper[] = [...PRESET_PAPERS];
export let chunksDatabase: PaperChunk[] = [...PRESET_CHUNKS];

export function getAllPapers(categoryFilter?: string): Paper[] {
  if (categoryFilter && categoryFilter !== 'All') {
    return papersDatabase.filter((p) => p.topicCategory === categoryFilter);
  }
  return papersDatabase;
}

export function getPaperById(id: string): Paper | undefined {
  return papersDatabase.find((p) => p.id === id);
}

export function getPaperChunks(paperId: string): PaperChunk[] {
  return chunksDatabase.filter((c) => c.paperId === paperId);
}

export function findPaperByArxivOrTitle(arxivId?: string, title?: string): Paper | undefined {
  return papersDatabase.find(
    (p) => (arxivId && p.arxivId === arxivId) || (title && p.title.toLowerCase() === title.toLowerCase())
  );
}

export function addPaper(paper: Paper, chunks: PaperChunk[]): void {
  papersDatabase.push(paper);
  chunksDatabase.push(...chunks);
}

export function deletePaperById(id: string): boolean {
  const initialLength = papersDatabase.length;
  papersDatabase = papersDatabase.filter((p) => p.id !== id);
  chunksDatabase = chunksDatabase.filter((c) => c.paperId !== id);
  return papersDatabase.length < initialLength;
}

export function resetSession(mode: 'empty' | 'preset' = 'preset'): void {
  if (mode === 'empty') {
    papersDatabase = [];
    chunksDatabase = [];
  } else {
    papersDatabase = [...PRESET_PAPERS];
    chunksDatabase = [...PRESET_CHUNKS];
  }
}

export function getDatabaseStats() {
  const paperCount = papersDatabase.length;
  const chunkCount = chunksDatabase.length;
  const categories = Array.from(new Set(papersDatabase.map((p) => p.topicCategory)));

  return {
    vectorDatabase: 'Qdrant (In-Memory Collection)',
    totalPapers: paperCount,
    totalChunks: chunkCount,
    indexDimensions: 768,
    similarityAlgorithm: 'Cosine Similarity + BM25 Hybrid (Reciprocal Rank Fusion)',
    categories,
    embeddingModel: 'gemini-embedding-2-preview',
    llmModel: 'gemini-3.6-flash',
  };
}
