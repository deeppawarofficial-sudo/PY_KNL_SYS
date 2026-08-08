import React from 'react';
import { Database, Search, Upload, Network, FileText, Cpu, Sparkles, MessageSquare, RotateCcw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'synthesize' | 'chat' | 'library' | 'comparison' | 'graph';
  setActiveTab: (tab: 'synthesize' | 'chat' | 'library' | 'comparison' | 'graph') => void;
  onOpenArXivModal: () => void;
  onOpenUploadModal: () => void;
  onOpenArchitectureModal: () => void;
  onOpenReviewModal: () => void;
  onOpenNewSessionModal: () => void;
  totalPapers: number;
  totalChunks: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenArXivModal,
  onOpenUploadModal,
  onOpenArchitectureModal,
  onOpenReviewModal,
  onOpenNewSessionModal,
  totalPapers,
  totalChunks,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Geometric Icon */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-600 flex items-center justify-center text-white font-bold shadow-2xs">
              <Sparkles className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">AI Knowledge Synthesizer</h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider rounded-md">
                  Multi-Paper RAG
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Research Assistant & Qdrant Vector Knowledge Base
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Geometric Balance */}
          <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('synthesize')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'synthesize'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Synthesizer</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chatbot</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Library ({totalPapers})</span>
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'comparison'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('graph')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'graph'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Graph</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenArchitectureModal}
              title="View RAG Architecture & Pipeline"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pipeline Info</span>
            </button>

            <button
              onClick={onOpenReviewModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Literature Review</span>
            </button>

            <button
              onClick={onOpenArXivModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-600" />
              <span>ArXiv Fetch</span>
            </button>

            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-100" />
              <span className="hidden sm:inline">Upload Paper</span>
            </button>

            <button
              onClick={onOpenNewSessionModal}
              title="Start New Research Session / Reset Index"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden xl:inline">New Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Bar for Vector Store & Model Status */}
      <div className="bg-slate-900 px-4 sm:px-6 py-1.5 border-t border-slate-800 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Qdrant Live
            </span>
            <span className="text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-300">
              <strong className="text-white">{totalChunks}</strong> vector chunks / <strong className="text-white">{totalPapers}</strong> research papers
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400 uppercase tracking-widest text-[10px]">
              Hybrid Cosine + BM25 RRF
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-300">
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
              Gemini 3.6 Flash
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

