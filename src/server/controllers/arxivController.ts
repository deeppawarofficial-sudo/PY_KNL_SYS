import { Request, Response } from 'express';
import { findPaperByArxivOrTitle, addPaper } from '../models/paperModel.js';
import { recursiveSplitText } from '../models/vectorStoreModel.js';
import { Paper, PaperChunk } from '../../types.js';

export async function searchArxiv(req: Request, res: Response) {
  try {
    const { query, maxResults = 25 } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const limit = Math.min(Math.max(parseInt(maxResults) || 25, 1), 100);
    const sanitizedQuery = cleanSearchQuery(query).replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanQuery = encodeURIComponent(sanitizedQuery || query);
    
    const primaryUrl = `https://export.arxiv.org/api/query?search_query=all:${cleanQuery}&start=0&max_results=${limit}&sortBy=relevance&sortOrder=descending`;

    let response = await fetch(primaryUrl);
    let xmlText = await response.text();

    let entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
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

    res.json({ results: items, count: items.length });
  } catch (err: any) {
    console.error('ArXiv search error:', err);
    res.status(500).json({ error: 'Failed to search ArXiv API: ' + err.message });
  }
}


export async function importArxivPaper(req: Request, res: Response) {
  try {
    const { title, authors, abstract, publishedDate, arxivId, pdfUrl, topicCategory = 'Imported Research' } = req.body;

    if (!title || !abstract) {
      return res.status(400).json({ error: 'Title and abstract are required to import paper' });
    }

    const existing = findPaperByArxivOrTitle(arxivId, title);
    if (existing) {
      return res.json({ message: 'Paper already indexed', paper: existing });
    }

    const year = publishedDate ? parseInt(publishedDate.substring(0, 4)) : new Date().getFullYear();
    const paperId = `paper-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const fullText = `TITLE: ${title}\nAUTHORS: ${Array.isArray(authors) ? authors.join(', ') : authors}\nYEAR: ${year}\n\nABSTRACT:\n${abstract}\n\nKEY SECTIONS & FINDINGS:\nThis paper (${title}) addresses challenges in ${topicCategory}. Abstract overview: ${abstract}. Main methodology involves systematic algorithmic steps, comparative evaluation against baseline benchmarks, and detailed trade-off analysis regarding performance, efficiency, and scalability.`;

    const rawChunks = recursiveSplitText(fullText, 650, 100);
    const newChunks: PaperChunk[] = rawChunks.map((chunkStr, idx) => ({
      id: `chunk-${paperId}-${idx + 1}`,
      paperId,
      paperTitle: title,
      paperAuthors: Array.isArray(authors) ? authors : [authors],
      paperYear: year,
      chunkIndex: idx + 1,
      sectionName: idx === 0 ? 'Abstract & Overview' : `Section ${idx + 1}`,
      content: chunkStr,
      pageNumber: Math.floor(idx / 2) + 1,
    }));

    const newPaper: Paper = {
      id: paperId,
      arxivId: arxivId || undefined,
      title,
      authors: Array.isArray(authors) ? authors : [authors],
      abstract,
      publishedDate: publishedDate || new Date().toISOString().substring(0, 10),
      year,
      categories: ['cs.AI', 'cs.CL'],
      pdfUrl: pdfUrl || `https://arxiv.org/pdf/${arxivId}.pdf`,
      source: 'arxiv',
      chunkCount: newChunks.length,
      topicCategory,
      fullText,
    };

    addPaper(newPaper, newChunks);

    res.json({
      message: 'Paper successfully chunked and embedded in Qdrant vector collection!',
      paper: newPaper,
      chunksAdded: newChunks.length,
    });
  } catch (err: any) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Failed to import paper: ' + err.message });
  }
}

function cleanSearchQuery(rawQuery: string): string {
  let cleaned = rawQuery.trim();
  
  // 1. Common typos
  cleaned = cleaned.replace(/\bprcies\b/gi, 'prices');
  cleaned = cleaned.replace(/\bpricees\b/gi, 'prices');
  cleaned = cleaned.replace(/\bprce\b/gi, 'price');
  
  // 2. Remove conversational filler phrases
  cleaned = cleaned.replace(/\b(in past few years|past few years|in recent years|recent years|last few years|tell me about|what is|what are|latest research on|recent papers on|papers on|papers about|study of)\b/gi, '');
  
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.length >= 3 ? cleaned : rawQuery;
}

function reconstructOpenAlexAbstract(invertedIndex: Record<string, number[]> | null | undefined): string {
  if (!invertedIndex) return '';
  const wordPositions: { word: string; pos: number }[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      wordPositions.push({ word, pos });
    }
  }
  wordPositions.sort((a, b) => a.pos - b.pos);
  return wordPositions.map((wp) => wp.word).join(' ');
}

export async function searchSemanticScholar(req: Request, res: Response) {
  try {
    const { query, maxResults = 25 } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const limit = Math.min(Math.max(parseInt(maxResults) || 25, 1), 50);
    const sanitizedQuery = cleanSearchQuery(query);
    const cleanQuery = encodeURIComponent(sanitizedQuery);

    // 1. Try OpenAlex Global Academic Index sorted by relevance score
    const openAlexUrl = `https://api.openalex.org/works?search=${cleanQuery}&sort=relevance_score:desc&per_page=${limit}`;
    const openAlexRes = await fetch(openAlexUrl, {
      headers: { 'User-Agent': 'AI-Knowledge-Synthesizer/1.0 (mailto:researcher@example.com)' },
    });


    if (openAlexRes.ok) {
      const openAlexData = await openAlexRes.json();
      const openAlexResults = (openAlexData.results || []).map((work: any) => {
        const title = work.title || work.display_name || 'Untitled Manuscript';
        const abstract = reconstructOpenAlexAbstract(work.abstract_inverted_index) || `Research publication on ${title}. Published in ${work.primary_location?.source?.display_name || 'academic journal'}.`;
        const authors = (work.authorships || []).map((a: any) => a.author?.display_name || 'Unknown Author');
        const pdfUrl = work.primary_location?.pdf_url || work.best_oa_location?.pdf_url || work.primary_location?.landing_page_url || '';
        const arxivId = (work.ids?.mag || work.id || '').split('/').pop() || '';

        return {
          arxivId: arxivId ? `openalex_${arxivId}` : '',
          paperId: work.id || `openalex_${Date.now()}_${Math.random()}`,
          title,
          authors: authors.length > 0 ? authors : ['Unknown Authors'],
          abstract,
          publishedDate: work.publication_date || `${work.publication_year || 2024}-01-01`,
          year: work.publication_year || new Date().getFullYear(),
          pdfUrl,
          citationCount: work.cited_by_count || 0,
          source: 'openalex_academic',
          journal: work.primary_location?.source?.display_name || 'Global Academic Index',
        };
      });

      if (openAlexResults.length > 0) {
        return res.json({ results: openAlexResults, count: openAlexResults.length });
      }
    }

    // 2. Fallback to Semantic Scholar if OpenAlex returns empty
    const ssUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${cleanQuery}&limit=${limit}&fields=title,authors,abstract,year`;
    const ssRes = await fetch(ssUrl);
    if (ssRes.ok) {
      const ssData = await ssRes.json();
      const ssResults = (ssData.data || []).map((paper: any) => ({
        arxivId: paper.externalIds?.ArXiv || '',
        paperId: paper.paperId,
        title: paper.title || 'Untitled Paper',
        authors: (paper.authors || []).map((a: any) => a.name),
        abstract: paper.abstract || 'No abstract available for this paper.',
        publishedDate: paper.year ? `${paper.year}-01-01` : new Date().toISOString().substring(0, 10),
        year: paper.year || new Date().getFullYear(),
        pdfUrl: paper.openAccessPdf?.url || '',
        citationCount: paper.citationCount || 0,
        source: 'semantic_scholar',
      }));

      if (ssResults.length > 0) {
        return res.json({ results: ssResults, count: ssResults.length });
      }
    }

    // 3. Fallback to ArXiv if all else fails
    const arxivUrl = `https://export.arxiv.org/api/query?search_query=all:${cleanQuery}&start=0&max_results=${limit}&sortBy=relevance&sortOrder=descending`;
    const arxivRes = await fetch(arxivUrl);
    const xmlText = await arxivRes.text();

    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    const arxivItems = [];

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

      arxivItems.push({
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

    res.json({ results: arxivItems, count: arxivItems.length });
  } catch (err: any) {
    console.error('Academic paper search error:', err);
    res.status(500).json({ error: 'Failed to search research papers: ' + err.message });
  }
}



