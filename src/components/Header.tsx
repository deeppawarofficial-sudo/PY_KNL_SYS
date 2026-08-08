import React from 'react';
import { Cpu, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenArchitectureModal: () => void;
  totalPapers: number;
  totalChunks: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenArchitectureModal }) => {
  return (
    <header className="flex-shrink-0 z-40 bg-slate-950 border-b border-slate-800/80">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-950/50">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm font-bold text-slate-100 tracking-tight">AI Knowledge Synthesizer</h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider rounded-md">
                Multi-Paper RAG
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Stack badge */}
            <span className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                BAAI/bge-large · Qdrant HNSW · Hybrid BM25
              </span>
            </span>

            {/* Pipeline button */}
            <button
              onClick={onOpenArchitectureModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-emerald-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 rounded-md transition-all cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Pipeline</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
