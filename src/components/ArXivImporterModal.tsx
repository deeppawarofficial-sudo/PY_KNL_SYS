import React, { useState } from 'react';
import { searchArXiv, searchSemanticScholar, importArXivPaper } from '../services/api';
import { X, Search, Download, CheckCircle2, RefreshCw, BookOpen, ExternalLink, Sparkles, Award } from 'lucide-react';

interface ArXivImporterModalProps {
  onClose: () => void;
  onPaperImported: () => void;
}

export const ArXivImporterModal: React.FC<ArXivImporterModalProps> = ({
  onClose,
  onPaperImported,
}) => {
  const [source, setSource] = useState<'semanticscholar' | 'arxiv'>('semanticscholar');
  const [query, setQuery] = useState('GraphRAG or Vector Search or LLM Reasoning');
  const [maxResults, setMaxResults] = useState<number>(15);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      if (source === 'semanticscholar') {
        const data = await searchSemanticScholar(query, maxResults);
        setResults(data.results || []);
      } else {
        const data = await searchArXiv(query, maxResults);
        setResults(data.results || []);
      }
    } catch (err: any) {
      setError(err.message || `Failed to query ${source === 'semanticscholar' ? 'Semantic Scholar' : 'ArXiv'} API`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (paper: any) => {
    const itemKey = paper.arxivId || paper.paperId || paper.title;
    setImportingId(itemKey);
    try {
      await importArXivPaper({
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        publishedDate: paper.publishedDate,
        arxivId: paper.arxivId,
        pdfUrl: paper.pdfUrl,
        topicCategory: source === 'semanticscholar' ? 'Semantic Scholar' : 'ArXiv Imported',
      });
      setImportedIds((prev) => [...prev, itemKey]);
      onPaperImported();
    } catch (err: any) {
      alert('Import failed: ' + err.message);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Import Research Papers (Global Academic Index & ArXiv)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Switcher & Search Bar */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 space-y-4">
          {/* Source Tabs */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start w-fit">
            <button
              type="button"
              onClick={() => { setSource('semanticscholar'); setResults([]); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                source === 'semanticscholar'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Global Academic Search (OpenAlex & AI)</span>
            </button>
            <button
              type="button"
              onClick={() => { setSource('arxiv'); setResults([]); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                source === 'arxiv'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>ArXiv Direct API</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                source === 'semanticscholar'
                  ? 'Search 250M+ global research papers (e.g. silver prices, GraphRAG, economics, quantum)...'
                  : 'Search ArXiv CS/Math/Physics (e.g. ti:"GraphRAG" or abs:"Vector Search")...'
              }

              className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 shrink-0">
                <span className="text-[11px] text-slate-400">Limit:</span>
                <select
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  className="bg-transparent text-slate-100 outline-none cursor-pointer font-bold text-xs"
                >
                  <option value={10} className="bg-slate-900">10 Papers</option>
                  <option value={20} className="bg-slate-900">20 Papers</option>
                  <option value={30} className="bg-slate-900">30 Papers</option>
                  <option value={50} className="bg-slate-900">50 Papers</option>
                </select>
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Search</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>
              {source === 'semanticscholar'
                ? 'Semantic Scholar API searches millions of CS/AI papers with AI neural relevance ranking.'
                : 'ArXiv API searches official ArXiv manuscript database.'}
            </span>
            {results.length > 0 && <span className="text-emerald-400 font-mono font-bold">Fetched {results.length} results</span>}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* Results List */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh]">
          {results.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs">
                {source === 'semanticscholar'
                  ? 'Search Semantic Scholar using natural research topics to find and chunk top relevant papers.'
                  : 'Search ArXiv for research papers to fetch, chunk, and embed into Qdrant vector store.'}
              </p>
            </div>
          ) : (
            results.map((paper) => {
              const itemKey = paper.arxivId || paper.paperId || paper.title;
              const isImported = importedIds.includes(itemKey);
              const isImporting = importingId === itemKey;

              return (
                <div
                  key={itemKey}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {paper.arxivId && (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                            ArXiv: {paper.arxivId}
                          </span>
                        )}
                        {source === 'semanticscholar' && paper.citationCount !== undefined && (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 rounded flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-400" />
                            {paper.citationCount} Citations
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">{paper.publishedDate}</span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 leading-snug">
                        {paper.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Authors: {paper.authors.join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {paper.pdfUrl && (
                        <a
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Open PDF"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        onClick={() => handleImport(paper)}
                        disabled={isImported || isImporting}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                          isImported
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        }`}
                      >
                        {isImported ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Indexed</span>
                          </>
                        ) : isImporting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Chunking...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Index Paper</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {paper.abstract}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Source: {source === 'semanticscholar' ? 'Semantic Scholar Graph API' : 'Official ArXiv API'}</span>
          <button onClick={onClose} className="text-slate-300 hover:underline cursor-pointer">Close</button>
        </div>
      </div>
    </div>
  );
};
