import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Paperclip,
  Trash2,
  BookOpen,
  ChevronDown,
  Loader2,
  FileText,
  Quote,
  Layers,
  ArrowRight,
  Bot,
  User,
  Check,
  Copy,
  Info
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Paper, Citation, SearchResultChunk } from '../types';
import { sendChatMessage } from '../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  retrievedChunks?: SearchResultChunk[];
  paperTitle?: string;
}

interface ResearchChatbotProps {
  papers: Paper[];
  selectedPaperId?: string;
  onSelectPaperId?: (paperId: string | undefined) => void;
  onSelectCitation?: (citation: Citation) => void;
  isFloating?: boolean;
  onCloseFloating?: () => void;
}

const DEFAULT_SUGGESTED_QUESTIONS = [
  'What are the core mechanisms and advantages of GraphRAG over flat RAG?',
  'How does DeepSeek-R1 incentivize reasoning without initial supervised fine-tuning?',
  'Explain how Hybrid Cosine + BM25 Reciprocal Rank Fusion works in this vector store.',
  'What are the main limitations and benchmark trade-offs across these indexed papers?'
];

export const ResearchChatbot: React.FC<ResearchChatbotProps> = ({
  papers,
  selectedPaperId,
  onSelectPaperId,
  onSelectCitation,
  isFloating = false,
  onCloseFloating
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Hello! I am your **AI Research Assistant**. Ask me any question about the indexed research papers, algorithms, benchmark metrics, or methodology comparisons. I ground every response in retrieved vector excerpts with citations.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeScopePaperId, setActiveScopePaperId] = useState<string | undefined>(selectedPaperId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCitationPreview, setActiveCitationPreview] = useState<Citation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveScopePaperId(selectedPaperId);
  }, [selectedPaperId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const selectedPaperObj = papers.find((p) => p.id === activeScopePaperId);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build history for API
      const messageHistory = messages.concat(userMsg).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await sendChatMessage({
        messages: messageHistory,
        paperId: activeScopePaperId
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: res.citations,
        retrievedChunks: res.retrievedChunks,
        paperTitle: res.paperTitle
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat submit error:', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Error querying research assistant**: ${err.message || 'Failed to connect to backend server. Please verify your connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content:
          'Chat history cleared. What paper or research question would you like to explore next?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper renderer to add clickable citation buttons inline
  const renderMessageContent = (msg: ChatMessage) => {
    return (
      <div className="space-y-3">
        <div className="prose prose-slate max-w-none text-sm text-slate-800 leading-relaxed dark:prose-invert">
          <Markdown>{msg.content}</Markdown>
        </div>

        {/* Display citations drawer if present */}
        {msg.citations && msg.citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200/80 bg-slate-50/80 -mx-1 px-3 py-2.5 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              <Quote className="w-3.5 h-3.5 text-indigo-600" />
              <span>Grounded Evidence ({msg.citations.length} Citations)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {msg.citations.map((cite) => (
                <button
                  key={cite.citationId}
                  onClick={() => {
                    if (onSelectCitation) onSelectCitation(cite);
                    setActiveCitationPreview(cite);
                  }}
                  className="group flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white text-indigo-700 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-md shadow-2xs transition-all text-left"
                >
                  <span className="font-mono font-bold text-indigo-600">[{cite.citationId}]</span>
                  <span className="truncate max-w-[180px] text-slate-700 group-hover:text-indigo-900">
                    {cite.paperTitle}
                  </span>
                  <span className="text-[10px] text-slate-400">p.{cite.pageNumber}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col bg-white border border-slate-200 shadow-sm ${
        isFloating
          ? 'fixed bottom-4 right-4 w-96 sm:w-[480px] h-[620px] z-50 rounded-2xl overflow-hidden shadow-2xl'
          : 'w-full h-[720px] rounded-xl overflow-hidden'
      }`}
    >
      {/* Top Header - Geometric Balance Style */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Bot className="w-4 h-4 text-indigo-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white">Research Paper Chatbot</h3>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                RAG Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Grounded Q&A over indexed paper repository</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClear}
            title="Clear Chat History"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {isFloating && onCloseFloating && (
            <button
              onClick={onCloseFloating}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors text-xs font-mono font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Scope Filter Bar */}
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="uppercase tracking-widest text-[10px] font-bold text-slate-400">
            Scope:
          </span>
        </div>

        <div className="relative flex-1 max-w-[280px]">
          <select
            value={activeScopePaperId || ''}
            onChange={(e) => {
              const val = e.target.value || undefined;
              setActiveScopePaperId(val);
              if (onSelectPaperId) onSelectPaperId(val);
            }}
            className="w-full bg-white text-slate-800 border border-slate-200 rounded-md py-1 px-2 pr-6 text-xs font-medium focus:outline-none focus:border-indigo-500 truncate appearance-none cursor-pointer shadow-2xs"
          >
            <option value="">🌐 Entire Repository ({papers.length} Papers)</option>
            {papers.map((p) => (
              <option key={p.id} value={p.id}>
                📄 {p.title} ({p.year})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
        </div>
      </div>

      {/* Message History Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-slate-800 text-slate-100'
                  : 'bg-indigo-600 text-white shadow-2xs'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`relative max-w-[85%] rounded-xl p-3.5 border shadow-2xs ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white border-indigo-700'
                  : 'bg-white text-slate-800 border-slate-200'
              }`}
            >
              {/* Top Meta info */}
              <div
                className={`flex items-center justify-between gap-4 mb-1.5 text-[10px] font-mono ${
                  msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                }`}
              >
                <span className="font-bold">
                  {msg.role === 'user' ? 'Researcher Query' : msg.paperTitle || 'AI Assistant'}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Content */}
              {msg.role === 'user' ? (
                <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              ) : (
                renderMessageContent(msg)
              )}

              {/* Copy Action for AI answers */}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => copyToClipboard(msg.content, msg.id)}
                  title="Copy response"
                  className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-600 rounded transition-colors"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-200" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-slate-600 text-xs flex items-center gap-2 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span>Retrieving vector chunks and synthesizing answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggested Questions Bar */}
      {messages.length < 5 && (
        <div className="bg-white border-t border-slate-200 p-2.5 shrink-0">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-indigo-500" />
            <span>Suggested Research Questions</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {DEFAULT_SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="text-left text-[11px] bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-300 px-2.5 py-1 rounded-md transition-colors truncate max-w-full"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              selectedPaperObj
                ? `Ask a question about "${selectedPaperObj.title.slice(0, 25)}..."`
                : 'Ask a research question across all indexed papers...'
            }
            disabled={isLoading}
            className="flex-1 bg-slate-50 text-slate-900 text-xs sm:text-sm border border-slate-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Inline Citation Quick Preview Drawer */}
      {activeCitationPreview && (
        <div className="bg-indigo-950 text-indigo-100 p-3 border-t border-indigo-900 text-xs shrink-0 animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-indigo-300 font-mono">
              [{activeCitationPreview.citationId}] {activeCitationPreview.paperTitle} ({activeCitationPreview.year})
            </span>
            <button
              onClick={() => setActiveCitationPreview(null)}
              className="text-indigo-400 hover:text-white font-mono text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-indigo-200 line-clamp-2 italic bg-indigo-900/60 p-2 rounded border border-indigo-800">
            "{activeCitationPreview.snippet}"
          </p>
          <div className="mt-1 flex items-center justify-between text-[10px] text-indigo-400 font-mono">
            <span>Section: {activeCitationPreview.sectionName}</span>
            <span>Page {activeCitationPreview.pageNumber}</span>
          </div>
        </div>
      )}
    </div>
  );
};
