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
import { MessageSquare, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'synthesize' | 'chat' | 'library' | 'comparison' | 'graph'>('synthesize');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [isLoadingPapers, setIsLoadingPapers] = useState<boolean>(true);
  const [selectedPaperIdForChat, setSelectedPaperIdForChat] = useState<string | undefined>(undefined);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState<boolean>(false);

  // Modals state
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [showArXivModal, setShowArXivModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState<boolean>(false);

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

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-600 selection:text-white flex flex-col">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenArXivModal={() => setShowArXivModal(true)}
        onOpenUploadModal={() => setShowUploadModal(true)}
        onOpenArchitectureModal={() => setShowArchitectureModal(true)}
        onOpenReviewModal={() => setShowReviewModal(true)}
        onOpenNewSessionModal={() => setShowNewSessionModal(true)}
        totalPapers={papers.length}
        totalChunks={totalChunks}
      />

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {isLoadingPapers ? (
          <div className="py-24 text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-2xs max-w-xl mx-auto mt-12">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <p className="text-sm font-bold text-slate-800">Initializing Vector Store</p>
              <p className="text-xs text-slate-500 font-mono mt-1">Loading Qdrant Collection & Research Papers...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'synthesize' && (
              <SynthesisWorkspace
                papers={papers}
                onCitationClick={(citation) => setActiveCitation(citation)}
                onPaperSelect={(paperId) => {
                  setSelectedPaperIdForChat(paperId);
                  setActiveTab('chat');
                }}
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

            {activeTab === 'comparison' && (
              <ComparisonMatrixView papers={papers} />
            )}

            {activeTab === 'graph' && (
              <KnowledgeGraphView />
            )}
          </>
        )}
      </main>

      {/* Floating Chatbot Overlay trigger button when on other tabs */}
      {activeTab !== 'chat' && !isFloatingChatOpen && (
        <button
          onClick={() => setIsFloatingChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-full px-4 py-3 shadow-lg hover:shadow-xl flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <MessageSquare className="w-4 h-4 text-indigo-100" />
          <span>Ask Paper Chatbot</span>
        </button>
      )}

      {/* Floating Collapsible Research Chatbot */}
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

      {/* Modals & Drawers */}
      {activeCitation && (
        <CitationInspectorModal
          citation={activeCitation}
          onClose={() => setActiveCitation(null)}
        />
      )}

      {showArXivModal && (
        <ArXivImporterModal
          onClose={() => setShowArXivModal(false)}
          onPaperImported={() => loadData()}
        />
      )}

      {showUploadModal && (
        <PaperUploadModal
          onClose={() => setShowUploadModal(false)}
          onPaperUploaded={() => loadData()}
        />
      )}

      {showArchitectureModal && (
        <RAGArchitectureDrawer
          onClose={() => setShowArchitectureModal(false)}
        />
      )}

      {showReviewModal && (
        <LiteratureReviewModal
          onClose={() => setShowReviewModal(false)}
        />
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

