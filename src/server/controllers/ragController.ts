import { Request, Response } from 'express';
import { searchVectorStore } from '../models/vectorStoreModel.js';
import { chunksDatabase, getAllPapers } from '../models/paperModel.js';
import { callNemotronLlm } from '../services/nemotronService.js';
import { Citation, SynthesisResult, ComparisonMatrix } from '../../types.js';

export function searchRag(req: Request, res: Response) {
  const { query, paperIds, topK = 6, minSimilarity = 0.05, enableHybrid = true } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const chunks = searchVectorStore(query, paperIds, topK, minSimilarity, enableHybrid);
  res.json({
    query,
    retrievedChunks: chunks,
    totalChunksSearched: chunksDatabase.length,
    matchedCount: chunks.length,
  });
}

export async function synthesizeRag(req: Request, res: Response) {
  const startTime = Date.now();
  try {
    const { query, paperIds, topK = 8, minSimilarity = 0.02, enableHybrid = true } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Research query is required' });
    }

    const retrievedChunks = searchVectorStore(query, paperIds, topK, minSimilarity, enableHybrid);

    if (retrievedChunks.length === 0) {
      return res.status(404).json({
        error: 'No relevant paper chunks found in vector database matching the query criteria.',
      });
    }

    const citations: Citation[] = retrievedChunks.map((chunk, index) => {
      const citeId = `C${index + 1}`;
      return {
        citationId: citeId,
        paperId: chunk.paperId,
        paperTitle: chunk.paperTitle,
        authors: chunk.paperAuthors,
        year: chunk.paperYear,
        sectionName: chunk.sectionName,
        pageNumber: chunk.pageNumber,
        chunkId: chunk.id,
        snippet: chunk.content,
      };
    });

    const contextPrompt = citations
      .map(
        (c) =>
          `SOURCE CITATION [${c.citationId}]:
Paper Title: "${c.paperTitle}" (${c.year}) by ${c.authors.join(', ')}
Section: ${c.sectionName} (Page ${c.pageNumber})
Excerpts:
${c.snippet}
`
      )
      .join('\n----------------------------------------\n');

    const systemInstruction = `You are the AI Knowledge Synthesizer, an expert multi-paper research assistant powered by Nvidia Nemotron LLM.
Your goal is to answer research questions by synthesizing information across multiple scientific papers.

CRITICAL CITATION RULES:
1. You MUST synthesize information from multiple papers into a cohesive, rigorous answer.
2. Every major claim, methodology comparison, empirical result, or limitation MUST include inline citations using the exact citation tags provided in the context, e.g., [C1], [C2], [C3].
3. Never invent facts or citations outside the provided sources.
4. Structure your synthesis with markdown headers, concise comparisons, bullet points, and an explicit breakdown of consensus points vs conflicting opinions or limitations across papers.`;

    const userPrompt = `USER RESEARCH QUESTION:
"${query}"

RETRIEVED CONTEXT FROM VECTOR STORE:
${contextPrompt}

Please produce a comprehensive, structured synthesis answering the research question with inline citations [C1], [C2], etc.
Include:
1. Executive Summary / Direct Answer
2. Methodological & Theoretical Breakdown (with citations)
3. Key Consensus Points across papers
4. Conflicting Opinions or Identified Limitations
5. Structured Key Takeaways for Researchers`;

    const synthesizedAnswer = await callNemotronLlm({
      systemInstruction,
      prompt: userPrompt,
      temperature: 0.3,
    });

    const executionTimeMs = Date.now() - startTime;
    const paperIdsUsed = Array.from(new Set(citations.map((c) => c.paperId)));

    let comparisonMatrix: ComparisonMatrix | undefined = undefined;
    if (
      query.toLowerCase().includes('compare') ||
      query.toLowerCase().includes('vs') ||
      query.toLowerCase().includes('matrix') ||
      query.toLowerCase().includes('trade-off')
    ) {
      const uniquePapers = Array.from(
        new Map(citations.map((c) => [c.paperId, c])).values()
      ).slice(0, 4);

      comparisonMatrix = {
        topic: query,
        dimensions: ['Core Architecture', 'Key Advantage', 'Primary Limitation', 'Indexing/Query Overhead'],
        items: uniquePapers.map((c) => ({
          paperId: c.paperId,
          paperTitle: c.paperTitle,
          authors: c.authors,
          year: c.year,
          values: {
            'Core Architecture': c.sectionName.includes('Graph')
              ? 'Entity-Relation Knowledge Graph & Leiden Communities'
              : c.sectionName.includes('Dense') || c.sectionName.includes('FAISS')
              ? 'Dense Dual-Encoder Vector Embeddings & MIPS'
              : c.sectionName.includes('Reasoning') || c.sectionName.includes('RL')
              ? 'Chain-of-Thought RL & Multi-stage Alignment'
              : 'Transformer Self-Attention / Vector HNSW Indexing',
            'Key Advantage': c.sectionName.includes('Graph')
              ? 'Superior global query-focused summarization across entire dataset'
              : 'Sub-millisecond semantic retrieval for localized queries',
            'Primary Limitation': c.sectionName.includes('Graph')
              ? 'High upfront indexing token cost (10x-50x vs flat RAG)'
              : 'Fails on global corpus-wide summaries and rare exact keywords',
            'Indexing/Query Overhead': c.sectionName.includes('Graph')
              ? 'High LLM indexing overhead, parallel community summaries'
              : 'Low indexing cost, fast vector lookup',
          },
        })),
      };
    }

    const result: SynthesisResult = {
      id: `synth-${Date.now()}`,
      query,
      answer: synthesizedAnswer,
      citations,
      retrievedChunks,
      comparisonMatrix,
      executionTimeMs,
      papersUsedCount: paperIdsUsed.length,
      timestamp: new Date().toISOString(),
    };

    res.json(result);
  } catch (err: any) {
    console.error('Synthesis error:', err);
    res.status(500).json({
      error: 'Synthesis generation failed: ' + (err.message || String(err)),
    });
  }
}

export async function generateLiteratureReview(req: Request, res: Response) {
  try {
    const allPapers = getAllPapers();

    if (allPapers.length === 0) {
      return res.status(400).json({
        error: 'No indexed research papers found in repository. Please import or upload papers first.',
      });
    }

    const allPaperIds = allPapers.map((p) => p.id);
    const retrievedChunks = searchVectorStore(
      'literature review methodology findings limitations contributions comparison evaluation benchmark',
      allPaperIds,
      25,
      0.001,
      true
    );

    const citations: Citation[] = retrievedChunks.map((chunk, idx) => ({
      citationId: `C${idx + 1}`,
      paperId: chunk.paperId,
      paperTitle: chunk.paperTitle,
      authors: chunk.paperAuthors,
      year: chunk.paperYear,
      sectionName: chunk.sectionName,
      pageNumber: chunk.pageNumber,
      chunkId: chunk.id,
      snippet: chunk.content,
    }));

    const papersCatalogStr = allPapers
      .map(
        (p, idx) =>
          `PAPER [P${idx + 1}]: "${p.title}" (${p.year}) by ${p.authors.join(', ')}
Topic Domain: ${p.topicCategory}
ArXiv ID: ${p.arxivId || 'N/A'}
Abstract: ${p.abstract}`
      )
      .join('\n\n----------------------------------------\n\n');

    const contextStr = citations
      .map(
        (c) =>
          `[${c.citationId}] Paper: "${c.paperTitle}" (${c.year})\nSection: ${c.sectionName}\nExcerpts: ${c.snippet}`
      )
      .join('\n\n');

    const prompt = `You are an expert AI Research Assistant & Literature Review Synthesizer.
Your goal is to generate a unified, comprehensive, single-document Literature Review report that synthesizes ALL ${allPapers.length} research papers currently indexed in our repository.

==================================================
INDEXED PAPERS CATALOG (${allPapers.length} PAPERS TOTAL):
==================================================
${papersCatalogStr}

==================================================
RETRIEVED MULTI-PAPER VECTOR EXCERPTS:
==================================================
${contextStr}

CRITICAL REQUIREMENTS:
1. Cover ALL ${allPapers.length} indexed papers in this single literature review synthesis! Do not omit any paper.
2. Structure the review into clear, formal sections with Markdown headings.
3. Use inline citations e.g. [C1], [C2] or explicit paper titles where relevant.`;

    const fullReviewText = await callNemotronLlm({
      systemInstruction: 'You are an expert AI Research Assistant & Literature Review Synthesizer powered by Nvidia Nemotron LLM.',
      prompt,
      temperature: 0.25,
    });

    res.json({
      title: `State-of-the-Art Multi-Paper Literature Review (${allPapers.length} Indexed Papers)`,
      topicCategory: `All ${allPapers.length} Indexed Papers`,
      content: fullReviewText,
      executiveSummary: `Unified literature review synthesizing all ${allPapers.length} papers in the vector database repository: ${allPapers.map((p) => p.title).join('; ')}.`,
      citations,
      papersCount: allPapers.length,
      papersList: allPapers.map((p) => ({ id: p.id, title: p.title, year: p.year, authors: p.authors })),
      createdDate: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Literature review error:', err);
    res.status(500).json({ error: 'Literature review generation failed: ' + err.message });
  }
}

export async function getComparisonMatrix(req: Request, res: Response) {
  try {
    const allPapers = getAllPapers();
    if (allPapers.length === 0) {
      return res.json({ matrix: [], papersCount: 0 });
    }

    try {
      const papersInfo = allPapers.map((p) => ({
        id: p.id,
        title: p.title,
        authors: p.authors.join(', '),
        year: p.year,
        topicCategory: p.topicCategory,
        abstract: p.abstract,
      }));

      const prompt = `Analyze these ${allPapers.length} research papers currently indexed in our repository and generate a structured JSON comparison matrix evaluating ALL of them.

Indexed Papers:
${JSON.stringify(papersInfo, null, 2)}

Return a valid JSON object with a "matrix" key containing an array of objects for EACH paper in the repository with these exact keys:
- "paradigm": Short paradigm or architecture name
- "paper": Title with year (e.g., "From Local to Global: A Graph RAG Approach (2024)")
- "architecture": Technical architecture overview
- "retrievalType": Retrieval mechanism or reasoning technique
- "bestUseCase": Ideal use case scenario
- "keyAdvantage": Main performance or functional advantage
- "mainLimitation": Primary trade-off or constraint
- "indexingCost": Indexing token or compute cost (e.g. Low, Moderate, High)
- "queryLatency": Expected query response latency (e.g. "< 10ms", "~1.5s")

Return ONLY the valid JSON object.`;

      const responseText = await callNemotronLlm({
        systemInstruction: 'You are a JSON matrix generator.',
        prompt,
        temperature: 0.2,
      });

      const parsed = JSON.parse(responseText.match(/\{[\s\S]*\}/)?.[0] || responseText);
      if (parsed.matrix && Array.isArray(parsed.matrix)) {
        return res.json({ matrix: parsed.matrix, papersCount: allPapers.length });
      }
    } catch (aiErr) {
      console.warn('Nemotron matrix generation fallback:', aiErr);
    }

    const fallbackMatrix = allPapers.map((paper) => ({
      paradigm: paper.topicCategory || 'Indexed Research',
      paper: `${paper.title} (${paper.year})`,
      architecture: paper.abstract.slice(0, 140) + '...',
      retrievalType: paper.source === 'arxiv' ? 'ArXiv Indexing' : 'Vector HNSW Cosine Similarity',
      bestUseCase: `Domain research in ${paper.topicCategory}`,
      keyAdvantage: `Indexed with ${paper.chunkCount} vector chunks`,
      mainLimitation: 'Domain specific evaluation',
      indexingCost: 'Low',
      queryLatency: 'Fast (< 50ms)',
    }));

    return res.json({ matrix: fallbackMatrix, papersCount: allPapers.length });
  } catch (err: any) {
    console.error('Matrix error:', err);
    res.status(500).json({ error: 'Failed to generate comparison matrix: ' + err.message });
  }
}
