import React from 'react';
import Markdown from 'react-markdown';
import { Citation, SearchResultChunk, SynthesisResult, ComparisonMatrix } from '../types';
import { exportSynthesisPDF } from '../utils/pdfExport';
import { BookOpen, CheckCircle2, AlertTriangle, Clock, Layers, Share2, Copy, Sparkles, ExternalLink, FileText, Download } from 'lucide-react';

interface SynthesizedResponseViewProps {
  result: SynthesisResult;
  onCitationClick: (citation: Citation) => void;
  onPaperClick?: (paperId: string) => void;
}

export const SynthesizedResponseView: React.FC<SynthesizedResponseViewProps> = ({
  result,
  onCitationClick,
  onPaperClick,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to replace [C1], [C2] tags in plain text with interactive elements
  const renderFormattedAnswer = (rawMarkdown: string) => {
    // Split markdown by citation pattern [C1], [C2], etc.
    const parts = rawMarkdown.split(/(\[C\d+\])/g);

    return parts.map((part, i) => {
      const match = part.match(/^\[C(\d+)\]$/);
      if (match) {
        const citeId = `C${match[1]}`;
        const citation = result.citations.find((c) => c.citationId === citeId);
        if (citation) {
          return (
            <button
              key={i}
              onClick={() => onCitationClick(citation)}
              className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 text-xs font-mono font-semibold text-emerald-300 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700/80 rounded transition-all cursor-pointer shadow-sm hover:scale-105"
              title={`View Source: "${citation.paperTitle}" (${citation.year}) - ${citation.sectionName}`}
            >
              <BookOpen className="w-3 h-3 text-emerald-400" />
              <span>[{citeId}]</span>
            </button>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview & Metadata Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
              Synthesized across {result.papersUsedCount} Papers
            </span>
            <span className="px-2 py-0.5 text-xs font-mono bg-slate-800 text-slate-300 rounded border border-slate-800 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {result.executionTimeMs}ms execution
            </span>
          </div>
          <h2 className="text-sm font-semibold text-slate-100">
            Query: "{result.query}"
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportSynthesisPDF(result)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF Report</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>{copied ? 'Copied' : 'Copy Synthesis'}</span>
          </button>
        </div>
      </div>

      {/* Main Synthesized Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Multi-Paper Knowledge Synthesis</h3>
        </div>

        {/* Markdown Rendered Answer */}
        <div className="prose prose-slate max-w-none text-slate-200 leading-relaxed text-sm space-y-4">
          <div className="whitespace-pre-line">
            {renderFormattedAnswer(result.answer)}
          </div>
        </div>
      </div>

      {/* Comparison Matrix Table if present */}
      {result.comparisonMatrix && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Comparative Methodological Matrix</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3">Paper / Model</th>
                  {result.comparisonMatrix.dimensions.map((dim, idx) => (
                    <th key={idx} className="p-3">{dim}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-200">
                {result.comparisonMatrix.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-semibold text-emerald-700">
                      <div>{item.paperTitle}</div>
                      <div className="text-[10px] text-slate-500 font-normal">({item.year}) - {item.authors[0]} et al.</div>
                    </td>
                    {result.comparisonMatrix!.dimensions.map((dim, dIdx) => (
                      <td key={dIdx} className="p-3 text-slate-300 leading-normal">
                        {item.values[dim] || 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Citations List & Vector Sources */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Indexed Citations & Evidence ({result.citations.length})</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Click citation to inspect chunk snippet</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.citations.map((cite) => (
            <div
              key={cite.citationId}
              onClick={() => onCitationClick(cite)}
              className="group bg-slate-800/50 hover:bg-emerald-50/60 border border-slate-800 hover:border-emerald-300 p-3.5 rounded-lg transition-all cursor-pointer flex flex-col justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-1.5 py-0.5 text-xs font-mono font-bold text-emerald-700 bg-slate-900 border border-slate-800 rounded">
                    [{cite.citationId}]
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Page {cite.pageNumber}</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-100 group-hover:text-emerald-900 transition-colors line-clamp-1">
                  {cite.paperTitle}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {cite.authors.join(', ')} ({cite.year}) &bull; {cite.sectionName}
                </p>
              </div>

              <div className="bg-slate-900 p-2 rounded text-[11px] text-slate-300 italic line-clamp-2 border border-slate-800">
                "{cite.snippet}"
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
