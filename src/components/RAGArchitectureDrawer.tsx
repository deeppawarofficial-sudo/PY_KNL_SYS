import React from 'react';
import { X, Cpu, Database, Search, Sparkles, Layers, ArrowRight, ShieldCheck, Code, FileText } from 'lucide-react';

interface RAGArchitectureDrawerProps {
  onClose: () => void;
}

export const RAGArchitectureDrawer: React.FC<RAGArchitectureDrawerProps> = ({ onClose }) => {
  const pipelineSteps = [
    {
      step: '01',
      title: 'Research Papers Ingestion',
      subtitle: 'ArXiv API / PDF Loader',
      description: 'Fetches PDFs & papers via ArXiv API or custom uploads with metadata extraction.',
      icon: FileText,
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/80 border-indigo-800',
    },
    {
      step: '02',
      title: 'Recursive Text Splitting',
      subtitle: 'RecursiveCharacterTextSplitter',
      description: 'Splits raw documents into ~650 character semantic chunks with 100 character overlap.',
      icon: Code,
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/80 border-cyan-800',
    },
    {
      step: '03',
      title: 'Vector Embeddings & Store',
      subtitle: 'Qdrant Collection Indexing',
      description: 'Computes high-dimensional term vectors and indexes into Qdrant HNSW graph collections.',
      icon: Database,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/80 border-emerald-800',
    },
    {
      step: '04',
      title: 'Hybrid Retriever Engine',
      subtitle: 'Cosine + BM25 RRF',
      description: 'Executes parallel dense cosine similarity search and sparse BM25 keyword matching.',
      icon: Search,
      color: 'text-amber-400',
      bg: 'bg-amber-950/80 border-amber-800',
    },
    {
      step: '05',
      title: 'Context Builder & Citations',
      subtitle: 'Citation Alignment [C1], [C2]',
      description: 'Assembles top K retrieved chunks with explicit citation tags and page numbers.',
      icon: Layers,
      color: 'text-purple-400',
      bg: 'bg-purple-950/80 border-purple-800',
    },
    {
      step: '06',
      title: 'Gemini LLM Synthesis',
      subtitle: 'Gemini 3.6 Flash Engine',
      description: 'Generates structured research answers, consensus breakdowns, and comparison matrices.',
      icon: Sparkles,
      color: 'text-pink-400',
      bg: 'bg-pink-950/80 border-pink-800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">AI Knowledge Synthesizer System Architecture</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pipeline Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
            <strong>System Blueprint:</strong> This application implements an end-to-end Multi-Paper Retrieval-Augmented Generation (RAG) architecture. It chunks research literature into fine-grained vector passages, indexes them into a Qdrant-emulated vector collection, retrieves relevant evidence using hybrid Cosine + BM25 scoring, and synthesizes grounded answers with Gemini 3.6 Flash LLM.
          </div>

          {/* Pipeline Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className={`border rounded-xl p-4 space-y-3 relative group hover:scale-[1.02] transition-all ${step.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">STEP {step.step}</span>
                    <Icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-100">{step.title}</h4>
                    <p className={`text-[11px] font-mono ${step.color}`}>{step.subtitle}</p>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Verification Badge */}
          <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Full-Stack RAG Execution Verified &bull; Zero Client API Key Exposure</span>
            </div>
            <span className="font-mono text-slate-400">Port 3000 Container Ingress</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Close Architecture Map
          </button>
        </div>
      </div>
    </div>
  );
};
