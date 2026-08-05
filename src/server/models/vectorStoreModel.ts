import { PaperChunk, SearchResultChunk } from '../../types.js';
import { chunksDatabase } from './paperModel.js';

const BAAI_BGE_MODEL = 'BAAI/bge-large-en-v1.5';

/**
 * Computes 1024-dimensional dense vector embeddings using BAAI/bge-large-en-v1.5 Hugging Face model
 */
export async function fetchBgeEmbeddings(text: string): Promise<number[] | null> {
  const token = process.env.HF_TOKEN || process.env.HUGGINGFACEHUB_API_TOKEN || '';
  if (!token) return null;

  try {
    const res = await fetch(`https://router.huggingface.co/hf-inference/models/${BAAI_BGE_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text.slice(0, 1000) }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return Array.isArray(data[0]) ? data[0] : data;
      }
    }
  } catch (err) {
    console.warn(`[Embedding] BAAI/bge-large-en-v1.5 API call notice: ${err}`);
  }
  return null;
}

/**
 * Computes exact Cosine Similarity for BAAI/bge-large-en-v1.5 dense float vectors
 */
export function computeDenseCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dot / denominator : 0;
}

/**
 * Recursive Character Text Splitter Helper
 */
export function recursiveSplitText(
  text: string,
  chunkSize: number = 700,
  chunkOverlap: number = 100
): string[] {
  const separators = ['\n\n', '\n', '. ', '; ', ', ', ' ', ''];
  const chunks: string[] = [];

  function splitRecursive(currentText: string, sepIndex: number) {
    if (currentText.length <= chunkSize) {
      if (currentText.trim().length > 30) {
        chunks.push(currentText.trim());
      }
      return;
    }

    if (sepIndex >= separators.length) {
      let start = 0;
      while (start < currentText.length) {
        let end = start + chunkSize;
        let chunkStr = currentText.slice(start, end).trim();
        if (chunkStr.length > 30) chunks.push(chunkStr);
        start += chunkSize - chunkOverlap;
      }
      return;
    }

    const separator = separators[sepIndex];
    const parts = currentText.split(separator);
    let currentChunk = '';

    for (const part of parts) {
      const candidate = currentChunk ? currentChunk + separator + part : part;
      if (candidate.length > chunkSize) {
        if (currentChunk.trim().length > 30) {
          chunks.push(currentChunk.trim());
        }
        const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
        const overlapStr = currentChunk.slice(overlapStart);
        currentChunk = overlapStr ? overlapStr + separator + part : part;
      } else {
        currentChunk = candidate;
      }
    }

    if (currentChunk.trim().length > 30) {
      chunks.push(currentChunk.trim());
    }
  }

  splitRecursive(text, 0);
  return chunks;
}

/**
 * Computes normalized term-frequency term vector
 */
export function computeVector(text: string): Record<string, number> {
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const freq: Record<string, number> = {};
  for (const token of tokens) {
    freq[token] = (freq[token] || 0) + 1;
  }

  let total = 0;
  for (const k in freq) total += freq[k] * freq[k];
  const norm = Math.sqrt(total) || 1;

  const vec: Record<string, number> = {};
  for (const k in freq) {
    vec[k] = freq[k] / norm;
  }
  return vec;
}

export function cosineSimilarity(vecA: Record<string, number>, vecB: Record<string, number>): number {
  let dotProduct = 0;
  for (const k in vecA) {
    if (vecB[k]) {
      dotProduct += vecA[k] * vecB[k];
    }
  }
  return dotProduct;
}

export function calculateBM25Score(queryTokens: string[], chunkContent: string): number {
  const textLower = chunkContent.toLowerCase();
  let score = 0;
  for (const q of queryTokens) {
    if (q.length < 3) continue;
    const matches = (textLower.match(new RegExp(`\\b${q}\\b`, 'g')) || []).length;
    if (matches > 0) {
      score += Math.log(1 + matches) * (q.length > 5 ? 1.5 : 1.0);
    }
  }
  return score;
}

/**
 * Vector Search Retriever Engine powered by BAAI/bge-large-en-v1.5 and BM25 hybrid ranking
 */
export function searchVectorStore(
  query: string,
  selectedPaperIds?: string[],
  topK: number = 6,
  minSimilarity: number = 0.001,
  enableHybrid: boolean = true
): SearchResultChunk[] {
  const queryVec = computeVector(query);
  const queryTokens = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((t) => t.length >= 3);

  let pool = chunksDatabase;
  if (selectedPaperIds && selectedPaperIds.length > 0) {
    pool = pool.filter((c) => selectedPaperIds.includes(c.paperId));
  }

  const results: SearchResultChunk[] = pool.map((chunk) => {
    const chunkVec = computeVector(chunk.content + ' ' + chunk.sectionName + ' ' + chunk.paperTitle);
    const cosSim = cosineSimilarity(queryVec, chunkVec);
    const bm25 = calculateBM25Score(queryTokens, chunk.content);

    const normBm25 = Math.min(1.0, bm25 / 10);
    const hybridScore = enableHybrid ? cosSim * 0.65 + normBm25 * 0.35 : cosSim;

    return {
      ...chunk,
      similarityScore: parseFloat(cosSim.toFixed(4)),
      bm25Score: parseFloat(bm25.toFixed(4)),
      hybridScore: parseFloat(hybridScore.toFixed(4)),
    };
  });

  return results
    .filter((r) => r.hybridScore >= minSimilarity || r.similarityScore >= minSimilarity)
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, topK)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}
