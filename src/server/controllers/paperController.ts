import { Request, Response } from 'express';
import * as pdfParseModule from 'pdf-parse';
import {
  getAllPapers,
  getPaperById,
  getPaperChunks,
  addPaper,
  deletePaperById,
  resetSession,
  getDatabaseStats,
} from '../models/paperModel.js';
import { recursiveSplitText } from '../models/vectorStoreModel.js';
import { Paper, PaperChunk } from '../../types.js';
async function parsePdfBuffer(pdfBuffer: Buffer): Promise<string> {
  const mod: any = pdfParseModule;
  if (mod.PDFParse || (mod.default && mod.default.PDFParse)) {
    const PDFParseClass = mod.PDFParse || mod.default.PDFParse;
    const parser = new PDFParseClass({ data: pdfBuffer });
    const result = await parser.getText();
    if (typeof result === 'string') return result;
    if (result && typeof result.text === 'string') return result.text;
  }
  const fn = mod.default || mod;
  if (typeof fn === 'function') {
    const result = await fn(pdfBuffer);
    return result.text || '';
  }
  throw new Error('Unable to initialize pdf-parse module.');
}

export function getStats(req: Request, res: Response) {
  res.json(getDatabaseStats());
}

export function getPapers(req: Request, res: Response) {
  const categoryFilter = req.query.category as string | undefined;
  const papers = getAllPapers(categoryFilter);
  res.json(papers);
}

export function getPaperDetails(req: Request, res: Response) {
  const paper = getPaperById(req.params.id);
  if (!paper) {
    return res.status(404).json({ error: 'Paper not found' });
  }
  const chunks = getPaperChunks(paper.id);
  res.json({ paper, chunks });
}

interface ExtractedPaperMetadata {
  title: string;
  authors: string[];
  year: number;
  doi?: string;
  journal?: string;
}

function extractPaperMetadataFromText(extractedText: string, defaultTitle: string, defaultAuthors: any): ExtractedPaperMetadata {
  const lines = extractedText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Year Extraction: look for explicit year patterns in first 35 lines
  let year = new Date().getFullYear();
  const headerSample = lines.slice(0, 35).join(' ');
  const yearMatch = headerSample.match(/\b(19[8-9]\d|20[0-2]\d)\b/);
  if (yearMatch) {
    const foundYear = parseInt(yearMatch[1], 10);
    if (foundYear >= 1980 && foundYear <= 2026) {
      year = foundYear;
    }
  }

  // 2. Title Extraction
  let title = defaultTitle;
  const isGenericFilename =
    /^[a-z0-9_-]+\.(pdf|txt)$/i.test(defaultTitle) ||
    /^\d+\.\d+/i.test(defaultTitle) ||
    /^lecture|^paper|^document|^s\d+/i.test(defaultTitle) ||
    defaultTitle.includes('_') ||
    defaultTitle.includes('-');

  if (isGenericFilename && lines.length > 0) {
    for (const line of lines.slice(0, 10)) {
      if (
        line.length >= 12 &&
        line.length <= 160 &&
        !/^abstract|^introduction|^volume|^doi|^https?:|^www\.|^journal/i.test(line)
      ) {
        title = line.replace(/^[0-9.]+\s*/, '').trim();
        break;
      }
    }
  }

  title = title
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (title === title.toLowerCase() || title === title.toUpperCase()) {
    title = title.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  }

  // 3. Authors Extraction
  let authors: string[] = [];
  if (typeof defaultAuthors === 'string' && defaultAuthors.trim() && defaultAuthors !== 'Local Upload') {
    authors = defaultAuthors.split(',').map((a: string) => a.trim());
  } else if (Array.isArray(defaultAuthors) && defaultAuthors.length > 0 && defaultAuthors[0] !== 'Local Upload') {
    authors = defaultAuthors;
  }

  if (authors.length === 0) {
    const abstractIdx = lines.findIndex((l) => /^abstract/i.test(l));
    const searchLines = abstractIdx > 0 ? lines.slice(1, abstractIdx) : lines.slice(1, 8);

    for (const line of searchLines) {
      if (
        !/^department|^university|^school|^faculty|^email|^keywords|^doi|^volume|^published/i.test(line) &&
        line.length >= 5 &&
        line.length <= 120 &&
        !/\d{4}/.test(line)
      ) {
        const names = line.split(/[,&]|\band\b/).map((n) => n.trim()).filter((n) => n.length > 2 && /^[A-Z]/.test(n));
        if (names.length > 0 && names.length <= 8) {
          authors = names;
          break;
        }
      }
    }
  }

  if (authors.length === 0) {
    authors = ['Academic Researcher'];
  }

  // 4. DOI & Journal extraction
  const doiMatch = headerSample.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
  const doi = doiMatch ? doiMatch[0].replace(/[;,.]$/, '') : undefined;

  let journal: string | undefined = undefined;
  if (headerSample.includes('Nature')) journal = 'Nature';
  else if (headerSample.includes('IEEE')) journal = 'IEEE Transactions';
  else if (headerSample.includes('Springer')) journal = 'Springer Journal';
  else if (headerSample.includes('Elsevier')) journal = 'Elsevier Science';
  else if (headerSample.includes('arXiv')) journal = 'ArXiv Preprint';

  return { title, authors, year, doi, journal };
}

export async function uploadPaper(req: Request, res: Response) {
  try {
    const { title: rawTitle, authors: rawAuthors, category = 'Custom Uploads', text, fileBase64 } = req.body;

    if (!rawTitle) {
      return res.status(400).json({ error: 'Paper title is required' });
    }

    let extractedText = text || '';

    if (fileBase64 && !extractedText) {
      try {
        const pdfBuffer = Buffer.from(fileBase64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
        extractedText = await parsePdfBuffer(pdfBuffer);
      } catch (pdfErr) {
        console.warn('PDF parsing fallback to raw text:', pdfErr);
      }
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract sufficient text content from uploaded file.' });
    }

    const { title, authors: parsedAuthors, year, doi, journal } = extractPaperMetadataFromText(extractedText, rawTitle, rawAuthors);
    const paperId = `paper-upload-${Date.now()}`;

    const rawChunks = recursiveSplitText(extractedText, 650, 100);
    const newChunks: PaperChunk[] = rawChunks.map((chunkStr, idx) => ({
      id: `chunk-${paperId}-${idx + 1}`,
      paperId,
      paperTitle: title,
      paperAuthors: parsedAuthors,
      paperYear: year,
      chunkIndex: idx + 1,
      sectionName: idx === 0 ? 'Introduction & Abstract' : `Section ${idx + 1}`,
      content: chunkStr,
      pageNumber: Math.floor(idx / 3) + 1,
    }));

    const abstractSnippet = extractedText.slice(0, 450).replace(/\n/g, ' ') + '...';

    const newPaper: Paper = {
      id: paperId,
      title,
      authors: parsedAuthors,
      abstract: abstractSnippet,
      publishedDate: `${year}-01-01`,
      year,
      categories: ['cs.AI'],
      source: 'upload',
      chunkCount: newChunks.length,
      topicCategory: category,
      fullText: extractedText,
      doi,
      journal,
    };

    addPaper(newPaper, newChunks);

    res.json({
      message: 'Uploaded paper successfully parsed, chunked, and indexed in vector store!',
      paper: newPaper,
      chunksAdded: newChunks.length,
    });
  } catch (err: any) {
    console.error('Upload paper error:', err);
    res.status(500).json({ error: 'Failed to process paper upload: ' + err.message });
  }
}

export function deletePaper(req: Request, res: Response) {
  const { id } = req.params;
  const deleted = deletePaperById(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Paper not found' });
  }
  res.json({ message: 'Paper and associated vector chunks successfully removed', paperId: id });
}

export function resetResearchSession(req: Request, res: Response) {
  const { mode = 'preset' } = req.body || {};
  resetSession(mode);
  res.json({
    message: mode === 'empty' ? 'Started fresh empty research session' : 'Reset research session to benchmark dataset',
    stats: getDatabaseStats(),
  });
}
