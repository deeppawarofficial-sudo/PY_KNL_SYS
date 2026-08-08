import React, { useState, useRef } from 'react';
import { uploadCustomPaper } from '../services/api';
import { X, Upload, FileText, CheckCircle2, RefreshCw, Layers, Trash2, Plus, AlertCircle, FilePlus, BookOpen } from 'lucide-react';

interface PaperUploadModalProps {
  onClose: () => void;
  onPaperUploaded: () => void;
}

interface QueuedFile {
  id: string;
  file: File;
  title: string;
  authors: string;
  category: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMsg?: string;
  text?: string;
  fileBase64?: string;
}

export const PaperUploadModal: React.FC<PaperUploadModalProps> = ({
  onClose,
  onPaperUploaded,
}) => {
  const [activeTab, setActiveTab] = useState<'batch' | 'manual'>('batch');

  // Batch Mode States
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentName: string } | null>(null);
  const [batchCategory, setBatchCategory] = useState('Custom Uploads');

  // Single Manual Mode States
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthors, setManualAuthors] = useState('');
  const [manualCategory, setManualCategory] = useState('Custom Uploads');
  const [manualText, setManualText] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to sanitize title from filename
  const cleanFileNameToTitle = (filename: string): string => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    return nameWithoutExt
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Helper to read file as Base64 or Text
  const readFileData = (file: File): Promise<{ text?: string; fileBase64?: string }> => {
    return new Promise((resolve, reject) => {
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      const reader = new FileReader();

      if (isPdf) {
        reader.onload = () => {
          resolve({ fileBase64: reader.result as string });
        };
        reader.onerror = () => reject(new Error('Failed to read PDF file'));
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          resolve({ text: reader.result as string });
        };
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
      }
    });
  };

  const handleFilesAdded = async (files: FileList | File[]) => {
    setError(null);
    const newQueueItems: QueuedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.match(/\.(pdf|txt|md)$/i)) continue;

      const item: QueuedFile = {
        id: `file-${Date.now()}-${Math.random()}`,
        file,
        title: cleanFileNameToTitle(file.name),
        authors: 'Local Upload',
        category: batchCategory,
        status: 'pending',
      };
      newQueueItems.push(item);
    }

    if (newQueueItems.length === 0) {
      setError('Please select valid .pdf, .txt, or .md research paper files.');
      return;
    }

    setQueuedFiles((prev) => [...prev, ...newQueueItems]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const removeQueuedFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateQueuedFile = (id: string, updates: Partial<QueuedFile>) => {
    setQueuedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const applyCategoryToAll = (newCat: string) => {
    setBatchCategory(newCat);
    setQueuedFiles((prev) => prev.map((item) => ({ ...item, category: newCat })));
  };

  const handleBatchUploadSubmit = async () => {
    if (queuedFiles.length === 0) {
      setError('Please select at least one paper file to index.');
      return;
    }

    setIsUploading(true);
    setError(null);

    let completedCount = 0;
    const total = queuedFiles.length;

    for (let i = 0; i < queuedFiles.length; i++) {
      const item = queuedFiles[i];
      if (item.status === 'completed') continue;

      setBatchProgress({
        current: i + 1,
        total,
        currentName: item.file.name,
      });

      updateQueuedFile(item.id, { status: 'uploading' });

      try {
        const fileContent = await readFileData(item.file);
        await uploadCustomPaper({
          title: item.title || cleanFileNameToTitle(item.file.name),
          authors: item.authors || 'Local Upload',
          category: item.category || batchCategory,
          text: fileContent.text,
          fileBase64: fileContent.fileBase64,
        });

        updateQueuedFile(item.id, { status: 'completed' });
        completedCount++;
      } catch (err: any) {
        console.error(`Error uploading ${item.file.name}:`, err);
        updateQueuedFile(item.id, { status: 'error', errorMsg: err.message || 'Parsing failed' });
      }
    }

    setIsUploading(false);
    setBatchProgress(null);

    if (completedCount > 0) {
      onPaperUploaded();
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualText.trim()) {
      setError('Paper title and text content are required.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await uploadCustomPaper({
        title: manualTitle,
        authors: manualAuthors,
        category: manualCategory,
        text: manualText,
      });
      onPaperUploaded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process manual text paste.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Batch Multi-Paper Local Importer</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'batch'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Select Multiple PDF / Text Files ({queuedFiles.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Single Text Paste</span>
            </button>
          </div>

          {activeTab === 'batch' && queuedFiles.length > 0 && (
            <button
              onClick={() => setQueuedFiles([])}
              className="text-[11px] text-slate-400 hover:text-red-400 transition-colors"
            >
              Clear Queue
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[65vh]">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'batch' ? (
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-cyan-400 bg-cyan-950/30'
                    : 'border-slate-700 bg-slate-950/60 hover:border-slate-500 hover:bg-slate-950'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,.md"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
                />
                <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-200">
                  Click to choose or drag & drop multiple research paper files
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports <span className="text-slate-200 font-mono font-bold">.PDF, .TXT, .MD</span> files (up to 25MB each)
                </p>
              </div>

              {/* Batch Category Controls */}
              {queuedFiles.length > 0 && (
                <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Default Category for Queue:</span>
                    <select
                      value={batchCategory}
                      onChange={(e) => applyCategoryToAll(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1 text-xs outline-none font-semibold cursor-pointer"
                    >
                      <option value="Custom Uploads">Custom Uploads</option>
                      <option value="RAG & Retrieval Systems">RAG & Retrieval Systems</option>
                      <option value="Reasoning & CoT">Reasoning & CoT</option>
                      <option value="LLM Architectures">LLM Architectures</option>
                      <option value="Vector Databases & Indexing">Vector Databases & Indexing</option>
                    </select>
                  </div>
                  <span className="text-cyan-400 font-mono font-bold">{queuedFiles.length} Papers Selected</span>
                </div>
              )}

              {/* File Queue List */}
              {queuedFiles.length > 0 && (
                <div className="space-y-3">
                  {queuedFiles.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateQueuedFile(item.id, { title: e.target.value })}
                            placeholder="Paper Title..."
                            className="bg-slate-900 border border-slate-700 focus:border-cyan-500 text-slate-100 font-semibold text-xs rounded-lg px-2.5 py-1 w-full outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>

                          {item.status === 'completed' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                              Indexed
                            </span>
                          )}

                          {item.status === 'uploading' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 rounded flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Indexing...
                            </span>
                          )}

                          {item.status === 'error' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-950 text-red-300 border border-red-800 rounded">
                              {item.errorMsg || 'Failed'}
                            </span>
                          )}

                          <button
                            onClick={() => removeQueuedFile(item.id)}
                            disabled={isUploading}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <input
                          type="text"
                          value={item.authors}
                          onChange={(e) => updateQueuedFile(item.id, { authors: e.target.value })}
                          placeholder="Authors (e.g. John Doe, Jane Smith)..."
                          className="bg-slate-900/80 border border-slate-800 text-slate-300 rounded px-2 py-0.5 outline-none"
                        />
                        <span className="text-slate-400 truncate flex items-center justify-end font-mono">
                          File: {item.file.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Manual Paste Tab */
            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Paper Title *</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Scaling Laws for Neural Language Models"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-slate-100 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Authors</label>
                  <input
                    type="text"
                    value={manualAuthors}
                    onChange={(e) => setManualAuthors(e.target.value)}
                    placeholder="e.g. Jared Kaplan, Sam McCandlish"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-slate-100 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Topic Category</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg p-2.5 text-xs text-slate-100 outline-none cursor-pointer"
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
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste full text or excerpts of the research paper here..."
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg p-3 text-xs text-slate-100 font-mono outline-none resize-none"
                  required
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer & Progress Bar */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {batchProgress ? (
            <div className="flex-1 w-full space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>Processing paper {batchProgress.current} of {batchProgress.total}...</span>
                <span className="font-mono text-cyan-400 font-bold truncate max-w-[200px]">
                  {batchProgress.currentName}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-slate-400">
              {activeTab === 'batch'
                ? 'Select multiple PDF/Text files to batch chunk and index in Qdrant store.'
                : 'Paste paper text directly.'}
            </span>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium cursor-pointer"
            >
              Close
            </button>

            {activeTab === 'batch' ? (
              <button
                type="button"
                onClick={handleBatchUploadSubmit}
                disabled={isUploading || queuedFiles.length === 0}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-950 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Batch Indexing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Process & Index {queuedFiles.length} Papers</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={isUploading}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-950 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Indexing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Index Paper</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
