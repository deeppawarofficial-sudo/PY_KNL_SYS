import { Request, Response } from 'express';
import * as pdfParseModule from 'pdf-parse';
const pdfParse = (pdfParseModule as any).default || pdfParseModule;
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

export async function uploadPaper(req: Request, res: Response) {
  try {
    const { title, authors, category = 'Custom Uploads', text, fileBase64 } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Paper title is required' });
    }

    let extractedText = text || '';

    if (fileBase64 && !extractedText) {
      try {
        const pdfBuffer = Buffer.from(fileBase64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
        const pdfData = await pdfParse(pdfBuffer);
        extractedText = pdfData.text;
      } catch (pdfErr) {
        console.warn('PDF parsing fallback to raw text:', pdfErr);
      }
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract sufficient text content from uploaded file.' });
    }

    const paperId = `paper-upload-${Date.now()}`;
    const year = new Date().getFullYear();
    const parsedAuthors = typeof authors === 'string' ? authors.split(',').map((a) => a.trim()) : authors || ['Custom Author'];

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
      publishedDate: new Date().toISOString().substring(0, 10),
      year,
      categories: ['cs.AI'],
      source: 'upload',
      chunkCount: newChunks.length,
      topicCategory: category,
      fullText: extractedText,
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
