import React, { useState } from 'react';
import { uploadCustomPaper } from '../services/api';
import { X, Upload, FileText, CheckCircle2, RefreshCw } from 'lucide-react';

interface PaperUploadModalProps {
  onClose: () => void;
  onPaperUploaded: () => void;
}

export const PaperUploadModal: React.FC<PaperUploadModalProps> = ({
  onClose,
  onPaperUploaded,
}) => {
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [category, setCategory] = useState('Custom Uploads');
  const [text, setText] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) {
      setError('Paper title and text content are required.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await uploadCustomPaper({
        title,
        authors,
        category,
        text,
      });
      onPaperUploaded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process custom paper upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Upload & Chunk Custom Research Paper</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Paper Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scaling Laws for Neural Language Models"
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-100 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Authors</label>
              <input
                type="text"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="e.g. Jared Kaplan, Sam McCandlish"
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-100 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Topic Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-100 outline-none"
              >
                <option value="Custom Uploads">Custom Uploads</option>
                <option value="RAG & Retrieval Systems">RAG & Retrieval Systems</option>
                <option value="Reasoning & CoT">Reasoning & CoT</option>
                <option value="LLM Architectures">LLM Architectures</option>
                <option value="Vector Databases & Indexing">Vector Databases & Indexing</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Full Paper Text Content *</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste full text or excerpts of the research paper here..."
              rows={8}
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg p-3 text-xs text-slate-100 font-mono outline-none resize-none"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-950"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Splitting & Indexing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chunk & Index Paper</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
