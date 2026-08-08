import { Request, Response } from 'express';
import { searchVectorStore } from '../models/vectorStoreModel.js';
import { getPaperById } from '../models/paperModel.js';
import { callNemotronLlm } from '../services/nemotronService.js';
import { Citation } from '../../types.js';

export async function chatWithPaper(req: Request, res: Response) {
  try {
    const { messages, paperId, topK = 6, modelProvider } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required for chat.' });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const userQuery = lastUserMessage ? lastUserMessage.content : '';

    if (!userQuery) {
      return res.status(400).json({ error: 'User query cannot be empty.' });
    }

    const selectedPaperIds = paperId ? [paperId] : undefined;
    const retrievedChunks = searchVectorStore(userQuery, selectedPaperIds, topK, 0.02, true);

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

    let contextPrompt = '';
    if (citations.length > 0) {
      contextPrompt = citations
        .map(
          (c) =>
            `SOURCE EXCERPT [${c.citationId}]:
Paper: "${c.paperTitle}" (${c.year}) by ${c.authors.join(', ')}
Section: ${c.sectionName} (Page ${c.pageNumber})
Content:
${c.snippet}`
        )
        .join('\n----------------------------------------\n');
    } else {
      contextPrompt = 'No specific excerpts found in vector database matching the query.';
    }

    const targetPaper = paperId ? getPaperById(paperId) : null;

    const systemInstruction = `You are the Research Paper Assistant Chatbot in the AI Knowledge Synthesizer app powered by Nvidia Nemotron LLM.
Your role is to answer user questions accurately, deeply, and clearly about the research paper(s) in the repository.

${targetPaper ? `YOU ARE CURRENTLY SCOPED TO THIS SPECIFIC PAPER: "${targetPaper.title}" by ${targetPaper.authors.join(', ')} (${targetPaper.year}).` : 'YOU ARE SCOPED TO THE ENTIRE RESEARCH PAPER REPOSITORY.'}

GUIDELINES FOR ACCURATE RESPONSES:
1. Always ground your answer in the provided research paper excerpts.
2. Whenever stating specific claims, mechanisms, benchmark numbers, equations, or findings from the paper excerpts, include inline citations like [C1], [C2].
3. Maintain a helpful, scholarly, yet accessible tone. Use markdown formatting (bolding, lists, code blocks) to make answers structured and easy to read.
4. Keep responses direct and relevant to what the user asked.`;

    const chatPrompt = `USER QUESTION:
${userQuery}

RETRIEVED RESEARCH PAPER EXCERPTS FROM VECTOR STORE:
${contextPrompt}

Answer the user question directly and accurately using inline citations [C1], [C2] where applicable.`;

    const answer = await callNemotronLlm({
      systemInstruction,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      prompt: chatPrompt,
      temperature: 0.3,
      modelProvider,
    });

    res.json({
      answer,
      citations,
      retrievedChunks,
      paperId: paperId || null,
      paperTitle: targetPaper ? targetPaper.title : 'All Papers',
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat assistant error: ' + (err.message || String(err)) });
  }
}
