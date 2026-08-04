import { Paper, PaperChunk, SearchResultChunk, SynthesisResult, KnowledgeGraphData, LiteratureReview, Citation } from '../types';

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

function apiUrl(path: string): string {
  if (path.startsWith('/')) {
    return `${BASE_URL}${path}`;
  }
  return `${BASE_URL}/${path}`;
}

export async function fetchStats() {
  const res = await fetch(apiUrl('/api/stats'));
  if (!res.ok) throw new Error('Failed to fetch index stats');
  return res.json();
}

export async function fetchPapers(category?: string): Promise<Paper[]> {
  const url = category && category !== 'All' ? apiUrl(`/api/papers?category=${encodeURIComponent(category)}`) : apiUrl('/api/papers');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch papers list');
  return res.json();
}

export async function fetchPaperDetails(paperId: string): Promise<{ paper: Paper; chunks: PaperChunk[] }> {
  const res = await fetch(apiUrl(`/api/papers/${encodeURIComponent(paperId)}`));
  if (!res.ok) throw new Error('Failed to fetch paper details');
  return res.json();
}

export async function deletePaper(paperId: string): Promise<{ message: string; paperId: string }> {
  const res = await fetch(apiUrl(`/api/papers/${encodeURIComponent(paperId)}`), {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to remove paper from index');
  }
  return res.json();
}

export async function resetResearchSession(mode: 'empty' | 'preset' = 'preset'): Promise<{ message: string }> {
  const res = await fetch(apiUrl('/api/papers/reset-session'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to reset research session');
  }
  return res.json();
}

export async function searchArXiv(query: string, maxResults: number = 25) {
  const res = await fetch(apiUrl('/api/arxiv/search'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, maxResults }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to search ArXiv');
  }
  return res.json();
}

export async function importArXivPaper(paperData: {
  title: string;
  authors: string[];
  abstract: string;
  publishedDate?: string;
  arxivId?: string;
  pdfUrl?: string;
  topicCategory?: string;
}) {
  const res = await fetch(apiUrl('/api/arxiv/import'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paperData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to import paper');
  }
  return res.json();
}

export async function uploadCustomPaper(paperData: {
  title: string;
  authors: string;
  category?: string;
  text?: string;
  fileBase64?: string;
}) {
  const res = await fetch(apiUrl('/api/upload-paper'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paperData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload paper');
  }
  return res.json();
}

export async function searchVectorChunks(params: {
  query: string;
  paperIds?: string[];
  topK?: number;
  minSimilarity?: number;
  enableHybrid?: boolean;
}): Promise<{ query: string; retrievedChunks: SearchResultChunk[] }> {
  const res = await fetch(apiUrl('/api/rag/search'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to search vector chunks');
  return res.json();
}

export async function synthesizeResearch(params: {
  query: string;
  paperIds?: string[];
  topK?: number;
  minSimilarity?: number;
  enableHybrid?: boolean;
}): Promise<SynthesisResult> {
  const res = await fetch(apiUrl('/api/rag/synthesize'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to synthesize research query');
  }
  return res.json();
}

export async function generateLiteratureReview(topicCategory?: string): Promise<LiteratureReview> {
  const res = await fetch(apiUrl('/api/rag/generate-review'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topicCategory: topicCategory || 'All' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate literature review');
  }
  return res.json();
}

export async function fetchComparisonMatrix(): Promise<{ matrix: any[]; papersCount: number }> {
  const res = await fetch(apiUrl('/api/rag/matrix'));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch comparison matrix');
  }
  return res.json();
}

export async function fetchKnowledgeGraph(): Promise<KnowledgeGraphData> {
  const res = await fetch(apiUrl('/api/knowledge-graph'));
  if (!res.ok) throw new Error('Failed to fetch knowledge graph data');
  return res.json();
}

export async function sendChatMessage(params: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  paperId?: string;
}): Promise<{
  answer: string;
  citations: Citation[];
  retrievedChunks: SearchResultChunk[];
  paperId?: string;
  paperTitle?: string;
}> {
  const res = await fetch(apiUrl('/api/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send chat message');
  }
  return res.json();
}

