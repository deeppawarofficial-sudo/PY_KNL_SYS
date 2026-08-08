export interface Paper {
  id: string;
  arxivId?: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedDate: string;
  year: number;
  categories: string[];
  pdfUrl?: string;
  source: 'arxiv' | 'upload' | 'preset';
  chunkCount: number;
  topicCategory: string;
  fullText?: string;
  doi?: string;
  journal?: string;
}

export interface PaperChunk {
  id: string;
  paperId: string;
  paperTitle: string;
  paperAuthors: string[];
  paperYear: number;
  chunkIndex: number;
  sectionName: string;
  content: string;
  pageNumber: number;
  embedding?: number[];
  tokenCount?: number;
}

export interface SearchResultChunk extends PaperChunk {
  similarityScore: number;
  bm25Score?: number;
  hybridScore: number;
  rank?: number;
}

export interface Citation {
  citationId: string; // e.g. "C1", "C2"
  paperId: string;
  paperTitle: string;
  authors: string[];
  year: number;
  sectionName: string;
  pageNumber: number;
  chunkId: string;
  snippet: string;
}

export interface ComparisonItem {
  paperId: string;
  paperTitle: string;
  authors: string[];
  year: number;
  values: Record<string, string>; // key = dimension (e.g., "Indexing Approach", "Query Latency", "Scalability", "Key Drawback")
}

export interface ComparisonMatrix {
  topic: string;
  dimensions: string[];
  items: ComparisonItem[];
}

export interface SynthesisResult {
  id: string;
  query: string;
  answer: string; // Markdown text with [C1], [C2] citations
  citations: Citation[];
  retrievedChunks: SearchResultChunk[];
  comparisonMatrix?: ComparisonMatrix;
  consensusPoints?: string[];
  conflictingOpinions?: string[];
  researchGaps?: string[];
  executionTimeMs: number;
  papersUsedCount: number;
  timestamp: string;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: 'paper' | 'concept' | 'methodology' | 'finding';
  paperId?: string;
  description?: string;
}

export interface KnowledgeGraphLink {
  source: string;
  target: string;
  relationship: string;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[];
  links: KnowledgeGraphLink[];
}

export interface LiteratureReviewSection {
  title: string;
  content: string;
  citationIds: string[];
}

export interface LiteratureReview {
  title: string;
  topicCategory: string;
  executiveSummary: string;
  content?: string;
  sections?: LiteratureReviewSection[] | string;
  citations: Citation[];
  papersCount?: number;
  papersList?: Array<{ id: string; title: string; year: number; authors: string[] }>;
  createdDate: string;
}

export interface RAGParams {
  topK: number;
  chunkSize: number;
  chunkOverlap: number;
  minSimilarity: number;
  hybridSearch: boolean;
  reranking: boolean;
  selectedPaperIds?: string[];
}
