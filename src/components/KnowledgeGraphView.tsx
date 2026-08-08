import React, { useEffect, useState } from 'react';
import { fetchKnowledgeGraph } from '../services/api';
import { KnowledgeGraphData, KnowledgeGraphNode } from '../types';
import { Network, RefreshCw, Sparkles, BookOpen, Layers } from 'lucide-react';

export const KnowledgeGraphView: React.FC = () => {
  const [data, setData] = useState<KnowledgeGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeGraphNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchKnowledgeGraph()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 space-y-3 shadow-2xs">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
        <p className="text-xs font-mono">Loading Research Knowledge Graph Network...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Geometric Balance */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
              <Network className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Research Knowledge Graph & Concept Map</h2>
          </div>
          <p className="text-xs text-slate-500">
            Interactive network mapping dependencies between papers, vector indexing methodologies, and AI reasoning paradigms.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            Papers ({data.nodes.filter((n) => n.type === 'paper').length})
          </span>
          <span className="flex items-center gap-1.5 text-cyan-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
            Methodologies ({data.nodes.filter((n) => n.type === 'methodology').length})
          </span>
          <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
            Concepts ({data.nodes.filter((n) => n.type === 'concept').length})
          </span>
        </div>
      </div>

      {/* SVG Interactive Canvas + Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Graph Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-slate-800/50 border border-slate-800 rounded-xl p-4 shadow-2xs min-h-[500px] flex items-center justify-center relative overflow-hidden">
          <svg className="w-full h-[480px] text-slate-400 select-none">
            {/* Draw Links */}
            {data.links.map((link, idx) => {
              // Approximate positions in a grid / circle
              const sourceIdx = data.nodes.findIndex((n) => n.id === link.source);
              const targetIdx = data.nodes.findIndex((n) => n.id === link.target);

              if (sourceIdx === -1 || targetIdx === -1) return null;

              const total = data.nodes.length;
              const angleS = (sourceIdx / total) * 2 * Math.PI;
              const angleT = (targetIdx / total) * 2 * Math.PI;

              const x1 = 350 + Math.cos(angleS) * 210;
              const y1 = 240 + Math.sin(angleS) * 170;
              const x2 = 350 + Math.cos(angleT) * 210;
              const y2 = 240 + Math.sin(angleT) * 170;

              return (
                <g key={idx}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {link.relationship}
                  </text>
                </g>
              );
            })}

            {/* Draw Nodes */}
            {data.nodes.map((node, idx) => {
              const total = data.nodes.length;
              const angle = (idx / total) * 2 * Math.PI;
              const x = 350 + Math.cos(angle) * 210;
              const y = 240 + Math.sin(angle) * 170;

              const isSelected = selectedNode?.id === node.id;
              let fill = '#10b981'; // emerald
              if (node.type === 'methodology') fill = '#0891b2'; // cyan
              if (node.type === 'concept') fill = '#d97706'; // amber

              return (
                <g
                  key={node.id}
                  transform={`translate(${x}, ${y})`}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer group"
                >
                  <circle
                    r={isSelected ? "18" : "14"}
                    fill={fill}
                    fillOpacity={isSelected ? "1" : "0.9"}
                    stroke="#ffffff"
                    strokeWidth="3"
                    className="transition-all duration-200 group-hover:scale-125 shadow-sm"
                  />
                  <text
                    y="28"
                    fill="#0f172a"
                    fontSize="10"
                    fontWeight={isSelected ? "bold" : "600"}
                    textAnchor="middle"
                    className="pointer-events-none drop-shadow-xs"
                  >
                    {node.label.length > 20 ? node.label.slice(0, 18) + '...' : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Inspector Drawer (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Knowledge Node Inspector</h3>
          </div>

          {selectedNode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded capitalize">
                  {selectedNode.type}
                </span>
                <span className="text-xs text-slate-500 font-mono">ID: {selectedNode.id}</span>
              </div>

              <h4 className="text-base font-bold text-slate-100">
                {selectedNode.label}
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                {selectedNode.description || 'No additional description registered.'}
              </p>

              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-2">
                <span className="font-bold text-slate-100">Connected Relationships:</span>
                <div className="space-y-1">
                  {data.links
                    .filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
                    .map((l, i) => (
                      <div key={i} className="bg-slate-800/50 p-2 rounded border border-slate-800 text-[11px] font-mono text-slate-300">
                        {l.source} ➔ <span className="text-emerald-600 font-bold">{l.relationship}</span> ➔ {l.target}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs">Click on any node in the interactive graph to inspect its relationships and conceptual details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
