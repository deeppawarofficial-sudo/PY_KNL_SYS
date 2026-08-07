import { Paper, PaperChunk, SearchResultChunk, SynthesisResult, KnowledgeGraphData, LiteratureReview, Citation } from '../types';

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!BASE_URL) return cleanPath;
  return `${BASE_URL}${cleanPath}`;
}

async function safeFetch(path: string, options?: RequestInit): Promise<Response> {
  const primaryUrl = apiUrl(path);
  try {
    const res = await fetch(primaryUrl, options);
    return res;
  } catch (err: any) {
    if (BASE_URL && (err.name === 'TypeError' || err.message?.includes('fetch'))) {
      const fallbackUrl = path.startsWith('/') ? path : `/${path}`;
      console.warn(`Fetch to ${primaryUrl} failed. Falling back to relative endpoint: ${fallbackUrl}`);
      return await fetch(fallbackUrl, options);
    }
    throw err;
  }
}

export async function fetchStats() {
  const res = await safeFetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch index stats');
  return res.json();
}

export async function fetchPapers(category?: string): Promise<Paper[]> {
  const path = category && category !== 'All' ? `/api/papers?category=${encodeURIComponent(category)}` : '/api/papers';
  const res = await safeFetch(path);
  if (!res.ok) throw new Error('Failed to fetch papers list');
  return res.json();
}

export async function fetchPaperDetails(paperId: string): Promise<{ paper: Paper; chunks: PaperChunk[] }> {
  const res = await safeFetch(`/api/papers/${encodeURIComponent(paperId)}`);
  if (!res.ok) throw new Error('Failed to fetch paper details');
  return res.json();
}

export async function deletePaper(paperId: string): Promise<{ message: string; paperId: string }> {
  const res = await safeFetch(`/api/papers/${encodeURIComponent(paperId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to remove paper from index');
  }
  return res.json();
}

export async function resetResearchSession(mode: 'empty' | 'preset' = 'preset'): Promise<{ message: string }> {
  const res = await safeFetch('/api/papers/reset-session', {
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
  try {
    const res = await safeFetch('/api/arxiv/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, maxResults }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend searchArXiv failed, trying direct browser fetch:', err);
  }

  // Direct client-side fetch to ArXiv API
  try {
    const sanitizedQuery = cleanSearchQuery(query).replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanQuery = encodeURIComponent(sanitizedQuery || query);
    const limit = Math.min(Math.max(maxResults, 1), 100);
    const url = `https://export.arxiv.org/api/query?search_query=all:${cleanQuery}&start=0&max_results=${limit}&sortBy=relevance&sortOrder=descending`;

    const response = await fetch(url);
    const xmlText = await response.text();

    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    const items = [];

    while ((match = entryRegex.exec(xmlText)) !== null) {
      const entryXml = match[1];

      const idMatch = entryXml.match(/<id>(.*?)<\/id>/);
      const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/);
      const summaryMatch = entryXml.match(/<summary>([\s\S]*?)<\/summary>/);
      const publishedMatch = entryXml.match(/<published>(.*?)<\/published>/);

      const authorRegex = /<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g;
      let authorMatch;
      const authors = [];
      while ((authorMatch = authorRegex.exec(entryXml)) !== null) {
        authors.push(authorMatch[1].trim());
      }

      const rawId = idMatch ? idMatch[1].trim() : '';
      const arxivId = rawId.replace(/^https?:\/\/arxiv\.org\/abs\//, '').replace(/v\d+$/, '');
      const title = titleMatch ? titleMatch[1].replace(/\n/g, ' ').trim() : 'Untitled Paper';
      const abstract = summaryMatch ? summaryMatch[1].replace(/\n/g, ' ').trim() : '';
      const publishedDate = publishedMatch ? publishedMatch[1].substring(0, 10) : new Date().toISOString().substring(0, 10);
      const year = parseInt(publishedDate.substring(0, 4)) || new Date().getFullYear();

      items.push({
        arxivId,
        title,
        authors: authors.length > 0 ? authors : ['Unknown Authors'],
        abstract,
        publishedDate,
        year,
        pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
        source: 'arxiv',
      });
    }

    return { results: items, count: items.length };
  } catch (directErr: any) {
    console.error('Direct ArXiv fetch error:', directErr);
    throw new Error('Failed to search ArXiv API: ' + directErr.message);
  }
}


function cleanSearchQuery(rawQuery: string): string {
  let cleaned = rawQuery.trim();
  cleaned = cleaned.replace(/\bprcies\b/gi, 'prices');
  cleaned = cleaned.replace(/\bpricees\b/gi, 'prices');
  cleaned = cleaned.replace(/\bprce\b/gi, 'price');
  cleaned = cleaned.replace(/\b(in past few years|past few years|in recent years|recent years|last few years|tell me about|what is|what are|latest research on|recent papers on|papers on|papers about|study of)\b/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.length >= 3 ? cleaned : rawQuery;
}

export async function searchSemanticScholar(query: string, maxResults: number = 25) {
  try {
    const res = await safeFetch('/api/semanticscholar/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, maxResults }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend search failed, trying direct browser fetch fallback:', err);
  }

  // 1. Direct browser fetch to OpenAlex Global Academic Index (250M+ publications)
  try {
    const sanitizedQuery = cleanSearchQuery(query);
    const cleanQuery = encodeURIComponent(sanitizedQuery);
    const limit = Math.min(Math.max(maxResults, 1), 50);
    const openAlexUrl = `https://api.openalex.org/works?search=${cleanQuery}&sort=relevance_score:desc&per_page=${limit}`;

    const openAlexRes = await fetch(openAlexUrl);

    if (openAlexRes.ok) {
      const openAlexData = await openAlexRes.json();
      const items = (openAlexData.results || []).map((work: any) => {
        let abstract = '';
        if (work.abstract_inverted_index) {
          const wordPositions: { word: string; pos: number }[] = [];
          for (const [word, positions] of Object.entries(work.abstract_inverted_index as Record<string, number[]>)) {
            for (const pos of positions) {
              wordPositions.push({ word, pos });
            }
          }
          wordPositions.sort((a, b) => a.pos - b.pos);
          abstract = wordPositions.map((wp) => wp.word).join(' ');
        }

        return {
          arxivId: work.ids?.mag || '',
          paperId: work.id || `openalex_${Date.now()}_${Math.random()}`,
          title: work.title || work.display_name || 'Untitled Manuscript',
          authors: (work.authorships || []).map((a: any) => a.author?.display_name || 'Unknown Author'),
          abstract: abstract || `Academic paper on ${work.title}. Published in ${work.primary_location?.source?.display_name || 'peer-reviewed journal'}.`,
          publishedDate: work.publication_date || `${work.publication_year || 2024}-01-01`,
          year: work.publication_year || new Date().getFullYear(),
          pdfUrl: work.primary_location?.pdf_url || work.best_oa_location?.pdf_url || work.primary_location?.landing_page_url || '',
          citationCount: work.cited_by_count || 0,
          source: 'openalex_academic',
        };
      });

      if (items.length > 0) {
        return { results: items, count: items.length };
      }
    }
  } catch (openAlexErr) {
    console.warn('Direct browser fetch to OpenAlex failed, trying Semantic Scholar:', openAlexErr);
  }

  // 2. Direct browser fetch fallback to Semantic Scholar API
  try {
    const cleanQuery = encodeURIComponent(query);
    const limit = Math.min(Math.max(maxResults, 1), 50);
    const directUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${cleanQuery}&limit=${limit}&fields=title,authors,abstract,year,externalIds,openAccessPdf`;

    let directRes = await fetch(directUrl);
    if (!directRes.ok) {
      const lightUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${cleanQuery}&limit=${limit}&fields=title,authors,abstract,year`;
      directRes = await fetch(lightUrl);
    }

    if (directRes.ok) {
      const directData = await directRes.json();
      const items = (directData.data || []).map((paper: any) => ({
        arxivId: paper.externalIds?.ArXiv || '',
        paperId: paper.paperId,
        title: paper.title || 'Untitled Paper',
        authors: (paper.authors || []).map((a: any) => a.name),
        abstract: paper.abstract || 'No abstract available.',
        publishedDate: paper.year ? `${paper.year}-01-01` : new Date().toISOString().substring(0, 10),
        year: paper.year || new Date().getFullYear(),
        pdfUrl: paper.openAccessPdf?.url || (paper.externalIds?.ArXiv ? `https://arxiv.org/pdf/${paper.externalIds.ArXiv}.pdf` : ''),
        source: 'semantic_scholar_direct',
      }));

      if (items.length > 0) {
        return { results: items, count: items.length };
      }
    }
  } catch (directErr) {
    console.warn('Direct browser fetch to Semantic Scholar failed, falling back to ArXiv:', directErr);
  }

  // 3. Ultimate fallback to ArXiv search
  return await searchArXiv(query, maxResults);
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
  const res = await safeFetch('/api/arxiv/import', {
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
  const res = await safeFetch('/api/upload-paper', {
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
  const res = await safeFetch('/api/rag/search', {
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
  const res = await safeFetch('/api/rag/synthesize', {
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
  const res = await safeFetch('/api/rag/generate-review', {
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
  const res = await safeFetch('/api/rag/matrix');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch comparison matrix');
  }
  return res.json();
}

export async function fetchKnowledgeGraph(): Promise<KnowledgeGraphData> {
  const res = await safeFetch('/api/knowledge-graph');
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
  const res = await safeFetch('/api/chat', {
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

