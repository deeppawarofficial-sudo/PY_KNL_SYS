import React, { useState } from 'react';
import { Paper, PaperChunk } from '../types';
import { fetchPaperDetails, deletePaper } from '../services/api';
import { BookOpen, Search, FileText, ExternalLink, ChevronRight, Filter, Users, Trash2, RotateCcw, Plus, AlertCircle } from 'lucide-react';

interface PaperLibraryProps {
  papers: Paper[];
  onOpenArXivModal: () => void;
  onOpenUploadModal: () => void;
  onOpenNewSessionModal: () => void;
  onPaperDeleted: () => void;
}

export const PaperLibrary: React.FC<PaperLibraryProps> = ({
  papers,
  onOpenArXivModal,
  onOpenUploadModal,
  onOpenNewSessionModal,
  onPaperDeleted,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [paperChunks, setPaperChunks] = useState<PaperChunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  const [deletingPaperId, setDeletingPaperId] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(papers.map((p) => p.topicCategory)))];

  const filteredPapers = papers.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authors.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.abstract.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.topicCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectPaper = async (paper: Paper) => {
    setSelectedPaper(paper);
    setIsLoadingChunks(true);
    try {
      const data = await fetchPaperDetails(paper.id);
      setPaperChunks(data.chunks);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingChunks(false);
    }
  };

  const handleDeletePaper = async (e: React.MouseEvent, paperId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this paper and all its indexed vector chunks from the repository?')) {
      return;
    }

    setDeletingPaperId(paperId);
    try {
      await deletePaper(paperId);
      if (selectedPaper?.id === paperId) {
        setSelectedPaper(null);
        setPaperChunks([]);
      }
      onPaperDeleted();
    } catch (err) {
      console.error(err);
      alert('Failed to delete paper');
    } finally {
      setDeletingPaperId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header - Geometric Balance */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search papers by title, author..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all"
          />
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Category Filters */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-xs pb-1 md:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 hidden lg:block"></div>

          {/* Start New Session Button */}
          <button
            onClick={onOpenNewSessionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* Main Grid & Chunk Inspector Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Papers List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
            <span>Showing {filteredPapers.length} indexed research papers</span>
            <span>Qdrant Vector Store</span>
          </div>

          {filteredPapers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-4 shadow-2xs">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No Research Papers Found</h3>
                <p className="text-xs text-slate-500">
                  {papers.length === 0
                    ? 'The vector repository is empty. Start a new session or import research papers.'
                    : 'No papers match your search criteria.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={onOpenArXivModal}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Import from ArXiv
                </button>
                <button
                  onClick={onOpenUploadModal}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
                >
                  Upload PDF Paper
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPapers.map((paper) => {
                const isSelected = selectedPaper?.id === paper.id;
                const isDeleting = deletingPaperId === paper.id;
                return (
                  <div
                    key={paper.id}
                    onClick={() => handleSelectPaper(paper)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 relative group ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-500 shadow-2xs'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-indigo-700 border border-slate-200 rounded">
                            {paper.topicCategory}
                          </span>
                          {paper.arxivId && (
                            <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                              ArXiv: {paper.arxivId}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {paper.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Remove Paper Action */}
                        <button
                          onClick={(e) => handleDeletePaper(e, paper.id)}
                          disabled={isDeleting}
                          title="Remove Paper & Vector Chunks"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-80 hover:opacity-100 cursor-pointer"
                        >
                          {isDeleting ? (
                            <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'translate-x-1 text-indigo-600' : ''}`} />
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {paper.abstract}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/80 pt-2.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}</span>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-slate-500">
                        <span>{paper.year}</span>
                        <span>&bull;</span>
                        <span className="text-indigo-600 font-bold">{paper.chunkCount} Chunks</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Paper Detail & Vector Chunks Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedPaper ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5 sticky top-20 max-h-[85vh] flex flex-col overflow-hidden">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Paper Vector Chunks</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDeletePaper(e, selectedPaper.id)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>

                  <span className="text-xs font-mono font-bold text-indigo-600">
                    {paperChunks.length} Chunks
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  {selectedPaper.title}
                </h4>
                <p className="text-xs text-slate-600">
                  <strong>Authors:</strong> {selectedPaper.authors.join(', ')} ({selectedPaper.year})
                </p>
                {selectedPaper.pdfUrl && (
                  <a
                    href={selectedPaper.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium hover:underline pt-1"
                  >
                    <span>Open PDF Document</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Chunks List */}
              <div className="overflow-y-auto space-y-3 pr-1">
                {isLoadingChunks ? (
                  <div className="text-xs text-slate-500 p-4 text-center">Loading vector chunks...</div>
                ) : (
                  paperChunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-indigo-700">
                        <span>Chunk #{chunk.chunkIndex}</span>
                        <span>{chunk.sectionName} (p. {chunk.pageNumber})</span>
                      </div>
                      <p className="text-slate-700 font-mono text-[11px] leading-relaxed">
                        {chunk.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 text-slate-500 shadow-2xs">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs">Select any paper from the library to inspect its raw text chunks and vector embeddings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

