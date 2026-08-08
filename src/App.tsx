import React, { useEffect, useState } from 'react';
import { fetchPapers, fetchStats } from './services/api';
import { Paper, Citation } from './types';
import { Header } from './components/Header';
import { SynthesisWorkspace } from './components/SynthesisWorkspace';
import { PaperLibrary } from './components/PaperLibrary';
import { ComparisonMatrixView } from './components/ComparisonMatrixView';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';
import { ResearchChatbot } from './components/ResearchChatbot';
import { CitationInspectorModal } from './components/CitationInspectorModal';
import { ArXivImporterModal } from './components/ArXivImporterModal';
import { PaperUploadModal } from './components/PaperUploadModal';
import { RAGArchitectureDrawer } from './components/RAGArchitectureDrawer';
import { LiteratureReviewModal } from './components/LiteratureReviewModal';
import { NewSessionModal } from './components/NewSessionModal';
import {
  MessageSquare, Sparkles, Search, FileText, Database, Network,
  Plus, Upload, BookOpen, RotateCcw,
} from 'lucide-react';

type TabType = 'synthesize' | 'chat' | 'library' | 'comparison' | 'graph';

const NAV_ITEMS = [
  { id: 'synthesize' as TabType, icon: Sparkles,      label: 'Synthesizer' },
  { id: 'chat'       as TabType, icon: MessageSquare, label: 'Chatbot'     },
  { id: 'library'    as TabType, icon: FileText,      label: 'Library'     },
  { id: 'comparison' as TabType, icon: Database,      label: 'Matrix'      },
  { id: 'graph'      as TabType, icon: Network,       label: 'Graph'       },
];

export default function App() {
  const [activeTab, setActiveTab]                       = useState<TabType>('synthesize');
  const [papers, setPapers]                             = useState<Paper[]>([]);
  const [totalChunks, setTotalChunks]                   = useState<number>(0);
  const [isLoadingPapers, setIsLoadingPapers]           = useState<boolean>(true);
  const [selectedPaperIdForChat, setSelectedPaperIdForChat] = useState<string | undefined>(undefined);
  const [isFloatingChatOpen, setIsFloatingChatOpen]     = useState<boolean>(false);
  const [sidebarExpanded, setSidebarExpanded]           = useState<boolean>(false);
  const [speedDialOpen, setSpeedDialOpen]               = useState<boolean>(false);

  // Modals
  const [activeCitation, setActiveCitation]             = useState<Citation | null>(null);
  const [showArXivModal, setShowArXivModal]             = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal]           = useState<boolean>(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal]           = useState<boolean>(false);
  const [showNewSessionModal, setShowNewSessionModal]   = useState<boolean>(false);

  const loadData = async () => {
    try {
      const paperList = await fetchPapers();
      setPapers(paperList);
      const stats = await fetchStats();
      setTotalChunks(stats.totalChunks);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoadingPapers(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const speedDialActions = [
    {
      icon: Upload, label: 'Upload PDF', colorClass: 'bg-amber-600 hover:bg-amber-500',
      action: () => { setShowUploadModal(true); setSpeedDialOpen(false); },
    },
    {
      icon: Search, label: 'ArXiv Fetch', colorClass: 'bg-sky-600 hover:bg-sky-500',
      action: () => { setShowArXivModal(true); setSpeedDialOpen(false); },
    },
    {
      icon: BookOpen, label: 'Literature Review', colorClass: 'bg-violet-600 hover:bg-violet-500',
      action: () => { setShowReviewModal(true); setSpeedDialOpen(false); },
    },
    {
      icon: RotateCcw, label: 'New Session', colorClass: 'bg-rose-600 hover:bg-rose-500',
      action: () => { setShowNewSessionModal(true); setSpeedDialOpen(false); },
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden selection:bg-amber-600 selection:text-white">

      {/* ── Slim Top Bar ── */}
      <Header
        onOpenArchitectureModal={() => setShowArchitectureModal(true)}
        totalPapers={papers.length}
        totalChunks={totalChunks}
      />

      {/* ── Body: Sidebar + Content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar */}
        <aside
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
          className={`flex flex-col py-3 bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out z-30 flex-shrink-0 ${
            sidebarExpanded ? 'w-52' : 'w-[60px]'
          }`}
        >
          {/* Nav Items */}
          <div className="flex-1 space-y-0.5 px-2">
            {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                title={label}
                className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer overflow-hidden ${
                  activeTab === id
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`}
              >
                {/* Active indicator bar */}
                {activeTab === id && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-amber-400 rounded-r-full" />
                )}
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span
                  className={`text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                  }`}
                >
                  {label}
                  {id === 'library' && papers.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-mono">
                      {papers.length}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Divider + Quick Chat toggle */}
          <div className="px-2 pt-3 border-t border-slate-800 mt-3">
            <button
              onClick={() => setIsFloatingChatOpen(!isFloatingChatOpen)}
              title="Quick Chat"
              className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer overflow-hidden border ${
                isFloatingChatOpen
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200 border-transparent'
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span
                className={`text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                }`}
              >
                Quick Chat
              </span>
              {isFloatingChatOpen && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {isLoadingPapers ? (
              <div className="py-24 text-center space-y-4 bg-slate-900 rounded-2xl border border-slate-800 max-w-xl mx-auto mt-12">
                <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <p className="text-sm font-bold text-slate-200">Initializing Vector Store</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">Loading Qdrant Collection &amp; Research Papers...</p>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'synthesize' && (
                  <SynthesisWorkspace
                    papers={papers}
                    onCitationClick={(citation) => setActiveCitation(citation)}
                    onPaperSelect={(paperId) => { setSelectedPaperIdForChat(paperId); setActiveTab('chat'); }}
                  />
                )}
                {activeTab === 'chat' && (
                  <div className="max-w-5xl mx-auto">
                    <ResearchChatbot
                      papers={papers}
                      selectedPaperId={selectedPaperIdForChat}
                      onSelectPaperId={(paperId) => setSelectedPaperIdForChat(paperId)}
                      onSelectCitation={(citation) => setActiveCitation(citation)}
                    />
                  </div>
                )}
                {activeTab === 'library' && (
                  <PaperLibrary
                    papers={papers}
                    onOpenArXivModal={() => setShowArXivModal(true)}
                    onOpenUploadModal={() => setShowUploadModal(true)}
                    onOpenNewSessionModal={() => setShowNewSessionModal(true)}
                    onPaperDeleted={() => loadData()}
                  />
                )}
                {activeTab === 'comparison' && <ComparisonMatrixView papers={papers} />}
                {activeTab === 'graph' && <KnowledgeGraphView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* FLOATING COMPONENTS                             */}
      {/* ──────────────────────────────────────────────── */}

      {/* 1. Live Stats Widget — bottom-left */}
      <div className="fixed bottom-6 left-20 z-40">
        <div className="flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-full px-4 py-2 shadow-xl shadow-black/50 text-xs font-mono select-none">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">Qdrant Live</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">
            <span className="text-white font-bold">{totalChunks}</span>
            <span className="text-slate-500 ml-1">chunks</span>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300">
            <span className="text-white font-bold">{papers.length}</span>
            <span className="text-slate-500 ml-1">papers</span>
          </span>
        </div>
      </div>

      {/* 2. SpeedDial FAB — bottom-right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5">
        {/* Expanded action items */}
        <div
          className={`flex flex-col items-end gap-2 transition-all duration-300 origin-bottom ${
            speedDialOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {speedDialActions.map(({ icon: Icon, label, colorClass, action }, i) => (
            <div
              key={label}
              className="flex items-center gap-2.5"
              style={{
                transitionDelay: speedDialOpen ? `${i * 40}ms` : '0ms',
              }}
            >
              <span className="text-xs font-semibold text-slate-200 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap">
                {label}
              </span>
              <button
                onClick={action}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 cursor-pointer text-white ${colorClass}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Main FAB trigger */}
        <button
          onClick={() => setSpeedDialOpen(!speedDialOpen)}
          className="w-14 h-14 rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/60 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-amber-500/30"
        >
          <Plus
            className={`w-6 h-6 transition-transform duration-300 ${speedDialOpen ? 'rotate-45' : 'rotate-0'}`}
          />
        </button>
      </div>

      {/* 3. Floating Research Chatbot overlay */}
      {isFloatingChatOpen && activeTab !== 'chat' && (
        <ResearchChatbot
          papers={papers}
          selectedPaperId={selectedPaperIdForChat}
          onSelectPaperId={(paperId) => setSelectedPaperIdForChat(paperId)}
          onSelectCitation={(citation) => setActiveCitation(citation)}
          isFloating={true}
          onCloseFloating={() => setIsFloatingChatOpen(false)}
        />
      )}

      {/* ── Modals ── */}
      {activeCitation && (
        <CitationInspectorModal citation={activeCitation} onClose={() => setActiveCitation(null)} />
      )}
      {showArXivModal && (
        <ArXivImporterModal onClose={() => setShowArXivModal(false)} onPaperImported={() => loadData()} />
      )}
      {showUploadModal && (
        <PaperUploadModal onClose={() => setShowUploadModal(false)} onPaperUploaded={() => loadData()} />
      )}
      {showArchitectureModal && (
        <RAGArchitectureDrawer onClose={() => setShowArchitectureModal(false)} />
      )}
      {showReviewModal && (
        <LiteratureReviewModal onClose={() => setShowReviewModal(false)} />
      )}
      {showNewSessionModal && (
        <NewSessionModal
          onClose={() => setShowNewSessionModal(false)}
          onSessionStarted={() => loadData()}
          currentPaperCount={papers.length}
        />
      )}
    </div>
  );
}
