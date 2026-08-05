import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

async function generatePdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function addHeader(title) {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title, margin, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('AI Multi-Paper Knowledge Synthesizer', pageWidth - margin, 15, { align: 'right' });
    y = 32;
  }

  function addFooter(pageNum, totalPages) {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    doc.text('Confidential - AI Multi-Paper Knowledge Synthesizer Documentation', margin, pageHeight - 6);
  }

  function checkPageBreak(neededHeight) {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      addHeader('Technical Architecture & System Flow');
      y = 32;
    }
  }

  // --- PAGE 1: Title & Executive Summary ---
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setTextColor(99, 102, 241); // indigo-500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TECHNICAL SYSTEM SPECIFICATION & DATA FLOW', margin, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('AI Multi-Paper Knowledge Synthesizer', margin, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text('End-to-End System Data Flow, RAG Retrieval Engine, Model Stack & Setup Guide', margin, 40);

  y = 65;

  // Overview Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 38, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Executive Overview', margin + 5, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const overviewText = 'The AI Multi-Paper Knowledge Synthesizer is a full-stack research paper synthesis platform. It enables researchers to query across multiple AI manuscripts, execute dense vector retrieval using BAAI/bge-large-en-v1.5 1024-dimensional embeddings, generate synthesis reports with verifiable inline citations [C1], [C2], build publication-ready literature reviews via Nvidia Nemotron / Qwen LLM, interact with a research paper chatbot, and explore comparative methodological matrices & dynamic knowledge graph networks.';
  const splitOverview = doc.splitTextToSize(overviewText, contentWidth - 10);
  doc.text(splitOverview, margin + 5, y + 15);

  y += 46;

  // System Architecture Table / Highlights
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Core System Architecture Components', margin, y);
  y += 6;

  const components = [
    { title: 'Frontend UI', desc: 'React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide React, Framer Motion' },
    { title: 'Backend Servers', desc: 'Express Node.js API (Port 3000) + Optional Python FastAPI Engine (Port 8000)' },
    { title: 'Embedding Model', desc: 'BAAI/bge-large-en-v1.5 (1024-dimensional dense float vector representations)' },
    { title: 'Vector Database', desc: 'Qdrant Vector DB with Cosine Similarity & BM25 Reciprocal Rank Fusion' },
    { title: 'LLM Reasoning', desc: 'Nvidia Nemotron 70B (Cloud API) / Qwen 2.5 3B (Local Ollama Engine)' },
  ];

  for (const comp of components) {
    checkPageBreak(12);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, 45, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(comp.title, margin + 3, y + 6.5);

    doc.setFillColor(255, 255, 255);
    doc.rect(margin + 45, y, contentWidth - 45, 10, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(comp.desc, margin + 48, y + 6.5);

    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 10, 'D');
    y += 12;
  }

  y += 4;

  // --- SECTION 3: End-to-End System Data Flow ---
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('3. End-to-End Data Flow Pipeline (Step-by-Step)', margin, y);
  y += 8;

  const steps = [
    {
      step: 'Step 1: Input & Ingestion Layer',
      details: 'Accepts live ArXiv API search queries (https://export.arxiv.org/api/query) or user PDF/Text uploads. XML and PDF-parse extract paper titles, authors, published dates, abstracts, and raw text text buffers.',
    },
    {
      step: 'Step 2: Text Parsing & Recursive Chunking',
      details: 'Manuscripts are split recursively using hierarchical separators ["\\n\\n", "\\n", ". ", " "] into 700-character chunks with 100-character overlap. Each chunk is tagged with paper metadata payloads.',
    },
    {
      step: 'Step 3: Dense Vector Embedding & Qdrant Storage',
      details: '1024-dimensional dense float vector embeddings are computed for each chunk using BAAI/bge-large-en-v1.5 model. Vector points and metadata are indexed in Qdrant Vector DB.',
    },
    {
      step: 'Step 4: Hybrid RAG Search & Citation Mapping',
      details: 'Retrieves top-K chunks using Hybrid Score = 0.65 * CosineSimilarity + 0.35 * BM25. Chunks are mapped into verifiable evidence blocks tagged with inline citations [C1], [C2], [C3].',
    },
    {
      step: 'Step 5: LLM Inference & React UI Output',
      details: 'Nvidia Nemotron / Qwen 2.5 LLM processes the grounded prompt and produces markdown responses, structured JSON matrices, dynamic SVG Knowledge Graph networks, and PDF report downloads.',
    },
  ];

  for (const s of steps) {
    checkPageBreak(22);
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(67, 56, 202); // indigo-700
    doc.text(s.step, margin + 4, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const splitText = doc.splitTextToSize(s.details, contentWidth - 8);
    doc.text(splitText, margin + 4, y + 10.5);

    y += 22;
  }

  // --- SECTION 4: Hardware & Local Execution Specification ---
  checkPageBreak(35);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Local Hardware & Execution Specification', margin, y);
  y += 8;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Optimized Configuration for AMD Ryzen 5 3500U / 12 GB RAM Specs:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('• Recommended Local LLM: qwen2.5:3b (Ollama Engine - 1.9 GB RAM footprint, ~20 tok/sec)', margin + 6, y + 13);
  doc.text('• Local Vector Embedding: BAAI/bge-large-en-v1.5 via Python sentence-transformers / Transformers.js', margin + 6, y + 19);
  doc.text('• Offline Fallback: Zero-latency built-in RAG reasoning engine with offline paper paragraph mapping', margin + 6, y + 25);

  y += 40;

  // Add Page Numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) {
      addHeader('Technical System Specification & Data Flow');
    }
    addFooter(i, totalPages);
  }

  const outputPath = path.join(process.cwd(), 'AI_Knowledge_Synthesizer_System_Architecture_and_Flow.pdf');
  doc.save(outputPath);
  console.log(`PDF successfully generated at: ${outputPath}`);
}

generatePdf().catch(console.error);
