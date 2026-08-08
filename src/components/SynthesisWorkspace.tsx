import React, { useState } from 'react';
import { Paper, Citation, SynthesisResult } from '../types';
import { synthesizeResearch } from '../services/api';
import { SynthesizedResponseView } from './SynthesizedResponseView';
import { Search, Sparkles, Filter, Sliders, RefreshCw, BookOpen, ChevronRight, Layers, ArrowRight, Lightbulb } from 'lucide-react';

interface SynthesisWorkspaceProps {
  papers: Paper[];
  onCitationClick: (citation: Citation) => void;
  onPaperSelect: (paperId: string) => void;
}

const PRESET_QUERIES = [
  {
    title: 'GraphRAG vs Traditional RAG',
    query: 'Compare GraphRAG and Traditional RAG in methodology, advantages, limitations, and query-focused summarization capabilities.',
    tag: 'RAG Systems',
  },
  {
    title: 'DeepSeek-R1 CoT & RL Reasoning',
    query: 'What are the key technical breakthroughs in DeepSeek-R1 reinforcement learning and chain-of-thought reasoning without initial SFT?',
    tag: 'Reasoning Models',
  },
  {
    title: 'HNSW vs IVF-PQ Vector Databases',
    query: 'Analyze the performance trade-offs between HNSW and IVF-PQ vector index algorithms in terms of recall, latency, memory footprint, and scalability.',
    tag: 'Vector DBs',
  },
  {
    title: 'Hybrid BM25 + Vector Retrieval',
    query: 'Why does combining sparse BM25 keyword retrieval with dense vector embeddings outperform pure dense semantic search?',
    tag: 'Hybrid Search',
  },
  {
    title: 'Cross-Encoder Reranking Trade-offs',
    query: 'What are the accuracy gains and latency overheads of applying Cross-Encoder reranking in production RAG pipelines?',
    tag: 'Reranking',
  },
];

export const SynthesisWorkspace: React.FC<SynthesisWorkspaceProps> = ({
  papers,
  onCitationClick,
  onPaperSelect,
}) => {
  const [query, setQuery] = useState('');
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [topK, setTopK] = useState(8);
  const [enableHybrid, setEnableHybrid] = useState(true);
  const [minSimilarity, setMinSimilarity] = useState(0.02);
  const [modelProvider, setModelProvider] = useState<'auto' | 'nemotron' | 'grok' | 'grounded'>('auto');

  const [isLoading, setIsLoading] = useState(false);
  const [synthesisStep, setSynthesisStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SynthesisResult | null>(null);

  const handleRunSynthesis = async (customQuery?: string) => {
    const activeQuery = customQuery || query;
    if (!activeQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setSynthesisStep('Querying Qdrant Vector Collection...');

    try {
      setTimeout(() => setSynthesisStep('Computing Cosine Similarity & BM25 Hybrid Scores...'), 400);
      setTimeout(() => setSynthesisStep('Building Multi-Paper Context & Structuring Citations...'), 900);
      setTimeout(() => setSynthesisStep(`Synthesizing Answer via ${modelProvider === 'nemotron' ? 'Nvidia Nemotron Cloud API' : modelProvider === 'grok' ? 'Groq (Grok) Cloud API' : 'Academic RAG Engine'}...`), 1400);

      const res = await synthesizeResearch({
        query: activeQuery,
        paperIds: selectedPaperIds.length > 0 ? selectedPaperIds : undefined,
        topK,
        minSimilarity,
        enableHybrid,
        modelProvider,
      });

      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to synthesize research query.');
    } finally {
      setIsLoading(false);
      setSynthesisStep('');
    }
  };

  const handleTogglePaper = (paperId: string) => {
    if (selectedPaperIds.includes(paperId)) {
      setSelectedPaperIds(selectedPaperIds.filter((id) => id !== paperId));
    } else {
      setSelectedPaperIds([...selectedPaperIds, paperId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input Box - Geometric Balance */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Multi-Paper Synthesis Query</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span className="uppercase tracking-widest text-[10px] font-bold text-slate-400">Targeting:</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {selectedPaperIds.length === 0 ? `All ${papers.length} Indexed Papers` : `${selectedPaperIds.length} Selected Papers`}
            </span>
          </div>
        </div>

        {/* Input Bar */}
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a complex multi-paper research question (e.g. 'Compare GraphRAG and Traditional RAG' or 'What are DeepSeek-R1 reasoning breakthroughs?')..."
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl p-3.5 pr-32 text-sm text-slate-900 placeholder-slate-400 outline-none resize-none transition-all font-sans"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleRunSynthesis();
              }
            }}
          />
          <button
            onClick={() => handleRunSynthesis()}
            disabled={isLoading || !query.trim()}
            className="absolute right-3 bottom-3.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Synthesize</span>
              </>
            )}
          </button>
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Recommended Research Queries</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUERIES.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(preset.query);
                  handleRunSynthesis(preset.query);
                }}
                className="group flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs text-slate-700 hover:text-emerald-900 transition-all text-left cursor-pointer"
              >
                <span className="font-bold text-emerald-600 group-hover:text-emerald-700">[{preset.tag}]</span>
                <span>{preset.title}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Advanced RAG Controls & Paper Selection Drawer */}
        <div className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Sliders & Toggles */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Model Engine:</span>
              <select
                value={modelProvider}
                onChange={(e) => setModelProvider(e.target.value as any)}
                className="bg-emerald-50/70 border border-emerald-200 rounded px-2.5 py-1 text-emerald-950 font-semibold text-xs outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
              >
                <option value="grok">🚀 Grok (Groq: llama-3.3-70b-versatile)</option>
                <option value="nemotron">☁️ HG Nemotron (Nvidia Nemotron 70B)</option>
                <option value="grounded">📄 Grounded Academic RAG Engine</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Top K Chunks:</span>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 font-mono text-xs outline-none focus:border-emerald-500"
              >
                <option value={4}>4 Chunks</option>
                <option value={6}>6 Chunks</option>
                <option value={8}>8 Chunks (Default)</option>
                <option value={12}>12 Chunks (Deep)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={enableHybrid}
                  onChange={(e) => setEnableHybrid(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                />
                <span>Hybrid BM25 + Vector Search</span>
              </label>
            </div>
          </div>

          {/* Paper Scope Toggle */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-medium">Paper Scope:</span>
            {selectedPaperIds.length > 0 && (
              <button
                onClick={() => setSelectedPaperIds([])}
                className="text-xs text-emerald-600 hover:underline font-semibold cursor-pointer"
              >
                Reset to All
              </button>
            )}
          </div>
        </div>

        {/* Paper Selector Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto pr-1">
          {papers.map((p) => {
            const isSelected = selectedPaperIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => handleTogglePaper(p.id)}
                className={`px-2.5 py-1 text-[11px] rounded-md border font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{p.title.slice(0, 26)}...</span>
                <span className="text-[10px] text-slate-400">({p.year})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Banner */}
      {isLoading && (
        <div className="bg-white border border-emerald-200 rounded-xl p-8 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">{synthesisStep || 'Executing Multi-Paper RAG Pipeline...'}</h3>
            <p className="text-xs text-slate-500 font-mono">
              Retrieving chunks from vector database &bull; Aligning citations &bull; Generating synthesis via Gemini 3.6 Flash
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-xs px-3 py-1 bg-red-600 text-white rounded font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Synthesis Result View */}
      {result && !isLoading && (
        <SynthesizedResponseView
          result={result}
          onCitationClick={onCitationClick}
          onPaperClick={onPaperSelect}
        />
      )}
    </div>
  );
};
