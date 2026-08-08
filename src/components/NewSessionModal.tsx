import React, { useState } from 'react';
import { RotateCcw, Trash2, BookOpen, AlertTriangle, X, Check } from 'lucide-react';
import { resetResearchSession } from '../services/api';

interface NewSessionModalProps {
  onClose: () => void;
  onSessionStarted: () => void;
  currentPaperCount: number;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  onClose,
  onSessionStarted,
  currentPaperCount,
}) => {
  const [selectedMode, setSelectedMode] = useState<'empty' | 'preset'>('empty');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSession = async () => {
    setIsResetting(true);
    setError(null);
    try {
      await resetResearchSession(selectedMode);
      onSessionStarted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reset research session');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Start New Research Session</h3>
            <p className="text-xs text-slate-500">Reset vector repository & start fresh</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Option Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Select Session Baseline Mode:
          </label>

          {/* Option 1: Clean Empty Session */}
          <div
            onClick={() => setSelectedMode('empty')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              selectedMode === 'empty'
                ? 'bg-emerald-50/80 border-emerald-600 shadow-2xs'
                : 'bg-slate-800/50 hover:bg-slate-800/70 border-slate-800'
            }`}
          >
            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
              selectedMode === 'empty' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-700'
            }`}>
              {selectedMode === 'empty' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-bold text-slate-100">Start Fresh Empty Session</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Clear all current {currentPaperCount} indexed research papers. Build your repository from scratch using ArXiv imports or custom PDF uploads.
              </p>
            </div>
          </div>

          {/* Option 2: Reset to Benchmark Papers */}
          <div
            onClick={() => setSelectedMode('preset')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              selectedMode === 'preset'
                ? 'bg-emerald-50/80 border-emerald-600 shadow-2xs'
                : 'bg-slate-800/50 hover:bg-slate-800/70 border-slate-800'
            }`}
          >
            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
              selectedMode === 'preset' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-700'
            }`}>
              {selectedMode === 'preset' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-100">Reset to Default Landmark Papers</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Restore the default 8 pre-indexed benchmark AI papers (GraphRAG, DeepSeek-R1, Traditional RAG, Chain-of-Thought, etc.).
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartSession}
            disabled={isResetting}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-2xs cursor-pointer flex items-center gap-2"
          >
            {isResetting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>{selectedMode === 'empty' ? 'Clear & Start Fresh' : 'Reset Session'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
