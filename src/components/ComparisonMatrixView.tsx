import React, { useState, useEffect } from 'react';
import { Paper } from '../types';
import { fetchComparisonMatrix } from '../services/api';
import { Layers, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

interface ComparisonMatrixViewProps {
  papers: Paper[];
}

export const ComparisonMatrixView: React.FC<ComparisonMatrixViewProps> = ({ papers }) => {
  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatrix = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchComparisonMatrix();
      setMatrixData(res.matrix || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch comparison matrix for indexed papers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, [papers.length]);

  return (
    <div className="space-y-6">
      {/* Title Header - Geometric Balance */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Dynamic Methodological Comparative Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Real-time technical evaluation generated across all <strong>{papers.length} currently indexed papers</strong> in your research repository.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadMatrix}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isLoading ? 'Analyzing Papers...' : 'Refresh Matrix'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">Synthesizing Comparative Matrix for {papers.length} Indexed Papers...</p>
            <p className="text-[11px] text-slate-500">Extracting architectural trade-offs, indexing costs, and retrieval paradigms</p>
          </div>
        ) : matrixData.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Indexed Papers for Matrix Evaluation</p>
            <p className="text-xs text-slate-500">Import or upload papers to build a dynamic comparative matrix.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-4 w-48">Research Paradigm</th>
                  <th className="p-4 w-64">Core Architecture</th>
                  <th className="p-4 w-64">Primary Advantage</th>
                  <th className="p-4 w-64">Key Limitation</th>
                  <th className="p-4 w-36">Indexing Cost</th>
                  <th className="p-4 w-36">Query Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {matrixData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-emerald-700 bg-slate-50/50">
                      <div>{item.paradigm}</div>
                      <div className="text-[10px] text-slate-500 font-normal mt-1 leading-tight">{item.paper}</div>
                    </td>
                    <td className="p-4 text-slate-800 leading-normal">
                      {item.architecture}
                    </td>
                    <td className="p-4 text-emerald-800 leading-normal font-medium bg-emerald-50/60">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item.keyAdvantage}</span>
                      </div>
                    </td>
                    <td className="p-4 text-amber-900 leading-normal font-medium bg-amber-50/60">
                      <div className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{item.mainLimitation}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-700">
                      {item.indexingCost}
                    </td>
                    <td className="p-4 font-mono font-semibold text-emerald-700">
                      {item.queryLatency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

