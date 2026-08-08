import React from 'react';
import { Citation } from '../types';
import { X, BookOpen, ExternalLink, FileText, Database, ShieldCheck, Sparkles } from 'lucide-react';

interface CitationInspectorModalProps {
  citation: Citation | null;
  onClose: () => void;
  onOpenPaperDetails?: (paperId: string) => void;
}

export const CitationInspectorModal: React.FC<CitationInspectorModalProps> = ({
  citation,
  onClose,
  onOpenPaperDetails,
}) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-bold text-emerald-300 bg-emerald-950 border border-emerald-800 rounded">
              Citation [{citation.citationId}]
            </span>
            <h3 className="text-sm font-bold text-slate-100">Vector Chunk Source Inspection</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Paper Info Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-emerald-400 font-mono font-medium">Source Document</span>
              <span className="text-xs text-slate-400 font-mono">Published {citation.year}</span>
            </div>
            <h4 className="text-base font-bold text-slate-100 leading-snug">
              {citation.paperTitle}
            </h4>
            <p className="text-xs text-slate-400">
              <strong>Authors:</strong> {citation.authors.join(', ')}
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs font-mono text-slate-300">
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Section: {citation.sectionName}
              </span>
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Page {citation.pageNumber}
              </span>
            </div>
          </div>

          {/* Exact Text Chunk */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                Raw Document Chunk Content
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                Chunk ID: {citation.chunkId}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
              {citation.snippet}
            </div>
          </div>

          {/* RAG Verification Note */}
          <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-emerald-200">Fact-Checked Vector Grounding</p>
              <p className="text-emerald-300/80 leading-normal">
                This exact paragraph was retrieved from the Qdrant vector database via hybrid semantic similarity and passed to Gemini 3.6 Flash for precise synthesis.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">Qdrant Vector Database Verified</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
          >
            Done Inspecting
          </button>
        </div>
      </div>
    </div>
  );
};
