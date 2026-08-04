import React, { useState } from 'react';
import { generateLiteratureReview } from '../services/api';
import { LiteratureReview } from '../types';
import { exportLiteratureReviewPDF } from '../utils/pdfExport';
import { X, FileText, Sparkles, RefreshCw, Copy, BookOpen, Layers, Download } from 'lucide-react';

interface LiteratureReviewModalProps {
  onClose: () => void;
}

export const LiteratureReviewModal: React.FC<LiteratureReviewModalProps> = ({ onClose }) => {
  const [review, setReview] = useState<LiteratureReview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await generateLiteratureReview('All');
      setReview(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate literature review');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!review) return;
    const text = `# ${review.title}\n\n${review.executiveSummary || ''}\n\n${
      review.content || (typeof review.sections === 'string' ? review.sections : '')
    }`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (!review) return;
    exportLiteratureReviewPDF(review);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Single-Document Repository Literature Review</h3>
              <p className="text-xs text-slate-400">Synthesize all currently indexed research papers into one comprehensive review</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Generator Controls */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Generates a single unified literature review across <strong>all indexed papers</strong> in your session.</span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Full Literature Review...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Single Review Summary</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}
        </div>

        {/* Output Area */}
        <div className="p-6 overflow-y-auto space-y-5 max-h-[65vh] text-xs leading-relaxed text-slate-200">
          {!review && !isGenerating ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-indigo-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-200">Ready to Synthesize Indexed Repository</h4>
                <p className="text-xs text-slate-400">
                  Click "Generate Single Review Summary" above to create an integrated literature review covering all indexed research papers simultaneously.
                </p>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="py-16 text-center space-y-4 animate-pulse">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-mono text-indigo-300 font-bold">Scanning Vector Repository & Indexing Chunks...</p>
                <p className="text-[11px] text-slate-400">Synthesizing full multi-paper review in a single unified academic document</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100">{review?.title}</h3>
                  <p className="text-xs text-indigo-400 font-mono mt-0.5">
                    Covering {review?.papersCount || 'All'} Indexed Papers &bull; {review?.createdDate ? new Date(review.createdDate).toLocaleTimeString() : 'Just now'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-950/50 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
                  </button>
                </div>
              </div>

              {/* Review Body */}
              <div className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-200 leading-relaxed font-sans">
                {review?.executiveSummary && (
                  <div className="p-4 bg-indigo-950/40 border border-indigo-800/40 rounded-xl space-y-1 text-slate-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Executive Summary</span>
                    <p className="text-xs leading-relaxed text-slate-300">{review.executiveSummary}</p>
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-200 space-y-3">
                  {review?.content}
                </div>
              </div>

              {/* Source Citations Catalog */}
              {review?.citations && review.citations.length > 0 && (
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Source Vector Excerpts & Citations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {review.citations.map((c) => (
                      <div key={c.citationId} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-indigo-400">[{c.citationId}] {c.paperTitle}</span>
                          <span className="text-slate-500">{c.year}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 italic">"{c.snippet}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

