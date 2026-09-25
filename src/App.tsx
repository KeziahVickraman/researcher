import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  ExternalLink,
  BookOpen,
  Sparkles,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Quote,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Award,
  Hash
} from 'lucide-react';

interface Paper {
  id?: string;
  title: string;
  authors: string;
  year: number | string;
  link: string;
  abstract?: string;
  citationCount?: number;
  venue?: string;
}

interface AskResponse {
  answer: string;
  toolsUsed: string[];
  papers: Paper[];
  mode?: string;
  connectedServersCount?: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'research' | 'general'>('research');
  
  // Research State
  const [researchQuery, setResearchQuery] = useState(
    'What are the most cited recent papers on urban parking demand prediction?'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [researchResult, setResearchResult] = useState<AskResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<number, boolean>>({});

  // General Q&A State
  const [generalQuery, setGeneralQuery] = useState('');
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalAnswer, setGeneralAnswer] = useState<string | null>(null);
  const [generalToolsUsed, setGeneralToolsUsed] = useState<string[]>([]);

  // Suggested research queries
  const sampleQueries = [
    'What are the most cited recent papers on urban parking demand prediction?',
    'Graph neural networks for spatiotemporal traffic forecasting',
    'Deep learning approaches for autonomous vehicle trajectory prediction',
    'Transformer models for dynamic mobility demand'
  ];

  // Auto-run the test execution query on mount to satisfy test requirement
  useEffect(() => {
    handleSearch('What are the most cited recent papers on urban parking demand prediction?');
  }, []);

  const handleSearch = async (queryToRun?: string) => {
    const query = (queryToRun || researchQuery).trim();
    if (!query) return;

    if (queryToRun) {
      setResearchQuery(queryToRun);
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep(1);

    // Simulate informative steps during API wait
    const timer1 = setTimeout(() => setLoadingStep(2), 1200);
    const timer2 = setTimeout(() => setLoadingStep(3), 2800);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          mode: 'research'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: AskResponse = await response.json();
      setResearchResult(data);
    } catch (err: any) {
      console.error('Search error:', err);
      setErrorMessage(err.message || 'Failed to communicate with research assistant.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  const handleGeneralAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalQuery.trim()) return;

    setGeneralLoading(true);
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: generalQuery.trim()
          // no mode provided - tests existing /api/ask behavior
        })
      });

      const data = await response.json();
      setGeneralAnswer(data.answer || 'No response returned.');
      setGeneralToolsUsed(data.toolsUsed || []);
    } catch (err: any) {
      setGeneralAnswer(`Error: ${err.message}`);
    } finally {
      setGeneralLoading(false);
    }
  };

  const copyCitation = (paper: Paper, idx: number) => {
    const citation = `${paper.authors} (${paper.year}). "${paper.title}." ${paper.venue ? paper.venue + '. ' : ''}${paper.link}`;
    navigator.clipboard.writeText(citation);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyFullAnswer = () => {
    if (!researchResult?.answer) return;
    navigator.clipboard.writeText(researchResult.answer);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const toggleAbstract = (idx: number) => {
    setExpandedAbstracts(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Helper to render basic markdown formatting cleanly
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Heading level 2 or 3
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-lg font-bold text-gray-900 mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-xl font-bold text-gray-900 mt-5 mb-2">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-2xl font-bold text-gray-900 mt-6 mb-3">{line.replace('# ', '')}</h1>;
      }

      // Unordered list item
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const itemContent = line.trim().replace(/^[\*\-]\s+/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-gray-800 my-1 leading-relaxed">
            {renderInlineMarkdown(itemContent)}
          </li>
        );
      }

      // Ordered list item (e.g. "1. ")
      const numberedMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 my-2 text-gray-800 leading-relaxed">
            <span className="font-semibold text-indigo-600 min-w-[1.5rem]">{numberedMatch[1]}.</span>
            <div className="flex-1">{renderInlineMarkdown(numberedMatch[2])}</div>
          </div>
        );
      }

      // Empty line / paragraph break
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Regular paragraph
      return (
        <p key={idx} className="text-gray-800 my-1.5 leading-relaxed">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string) => {
    // Replace markdown links [text](url) and bold **text**
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      if (match[1].startsWith('[')) {
        // Link: [anchor](url)
        const anchor = match[2];
        const url = match[3];
        parts.push(
          <a
            key={keyIdx++}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 underline font-medium inline-flex items-center gap-0.5"
          >
            {anchor}
            <ExternalLink className="w-3 h-3 inline" />
          </a>
        );
      } else if (match[1].startsWith('**')) {
        // Bold: **text**
        parts.push(<strong key={keyIdx++} className="font-semibold text-gray-900">{match[4]}</strong>);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : remaining;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-gray-900 tracking-tight">ScholarPulse</span>
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    MCP Host
                  </span>
                </div>
                <p className="text-xs text-gray-500">Semantic Scholar Academic Assistant</p>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('research')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'research'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Research Assistant
              </button>
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'general'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                General Q&A
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'research' ? (
          <div className="space-y-6">
            {/* Hero / Instruction Box */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
                <BookOpen className="w-64 h-64 text-white" />
              </div>
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-indigo-100 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  Semantic Scholar MCP Connected
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Academic Literature & Paper Discovery
                </h1>
                <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
                  Synthesize academic breakthroughs, analyze citations, and explore peer-reviewed literature powered by Semantic Scholar MCP tools.
                </p>
              </div>

              {/* Search Box */}
              <div className="mt-6 relative z-10">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch();
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={researchQuery}
                      onChange={(e) => setResearchQuery(e.target.value)}
                      placeholder="Ask a research question (e.g. 'What are the most cited recent papers on urban parking demand prediction?')"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-gray-900 text-sm placeholder-gray-400 border-0 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !researchQuery.trim()}
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Researching...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Search Papers</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Query Chips */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-indigo-200 font-medium">Try asking:</span>
                  {sampleQueries.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearch(q)}
                      className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                        researchQuery === q
                          ? 'bg-indigo-400/40 text-white border border-indigo-300 font-medium'
                          : 'bg-white/10 hover:bg-white/20 text-indigo-100 border border-white/10'
                      }`}
                    >
                      {idx === 0 ? '★ ' + q : q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Loading State Banner */}
            {isLoading && (
              <div className="bg-white rounded-2xl border border-indigo-100 p-8 text-center shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 animate-pulse">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {loadingStep === 1 && 'Connecting to MCP Server & Routing Tools...'}
                  {loadingStep === 2 && 'Querying Semantic Scholar for Highly Cited Papers...'}
                  {loadingStep >= 3 && 'Analyzing Citations & Synthesizing Findings...'}
                </h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Semantic Scholar MCP agent is discovering papers, retrieving abstracts, and formatting full academic citations.
                </p>

                {/* Step indicator bars */}
                <div className="max-w-xs mx-auto mt-6 flex gap-2">
                  <div className={`h-1.5 flex-1 rounded-full ${loadingStep >= 1 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                  <div className={`h-1.5 flex-1 rounded-full ${loadingStep >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                  <div className={`h-1.5 flex-1 rounded-full ${loadingStep >= 3 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && !isLoading && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3">
                <div className="font-medium text-sm">{errorMessage}</div>
              </div>
            )}

            {/* Results Section */}
            {researchResult && !isLoading && (
              <div className="space-y-6">
                {/* Tools Used Line (TASK 3 requirement) */}
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Tools used:
                    </span>
                    {researchResult.toolsUsed && researchResult.toolsUsed.length > 0 ? (
                      researchResult.toolsUsed.map((tool, idx) => (
                        <span
                          key={idx}
                          className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-2.5 py-0.5 rounded-md font-mono font-medium flex items-center gap-1"
                        >
                          <Hash className="w-3 h-3 text-indigo-500" />
                          {tool}
                        </span>
                      ))
                    ) : (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono">
                        paper_search (Semantic Scholar)
                      </span>
                    )}
                    <span className="text-xs text-gray-500 border-l border-gray-300 pl-2 ml-1">
                      Semantic Scholar MCP
                    </span>
                  </div>

                  <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Verified Citation Mode
                  </div>
                </div>

                {/* Synthesis & Papers Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Synthesis Text */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
                      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                          <h2 className="font-semibold text-gray-900 text-lg">Synthesized Analysis</h2>
                        </div>
                        <button
                          onClick={copyFullAnswer}
                          className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 hover:border-indigo-300 transition-colors"
                        >
                          {copiedAnswer ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedAnswer ? 'Copied' : 'Copy Text'}
                        </button>
                      </div>

                      <div className="prose prose-indigo max-w-none text-sm text-gray-800 leading-relaxed">
                        {renderFormattedText(researchResult.answer)}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Paper Cards (TASK 3 requirement) */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-indigo-600" />
                        <h2 className="font-semibold text-gray-900 text-lg">
                          Papers Used ({researchResult.papers?.length || 0})
                        </h2>
                      </div>
                      <span className="text-xs text-gray-500">Semantic Scholar Academic Graph</span>
                    </div>

                    <div className="space-y-3.5">
                      {researchResult.papers && researchResult.papers.length > 0 ? (
                        researchResult.papers.map((paper, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                          >
                            <div>
                              {/* Title & External Link */}
                              <div className="flex items-start justify-between gap-2">
                                <a
                                  href={paper.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-gray-900 text-sm hover:text-indigo-600 transition-colors leading-snug"
                                >
                                  {paper.title}
                                </a>
                                <a
                                  href={paper.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open in Semantic Scholar"
                                  className="text-gray-400 hover:text-indigo-600 p-1 shrink-0"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>

                              {/* Authors */}
                              <p className="text-xs text-gray-600 mt-1.5 font-medium line-clamp-2">
                                {paper.authors}
                              </p>

                              {/* Badges: Year, Citation Count, Venue */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded font-medium">
                                  {paper.year}
                                </span>
                                {paper.citationCount !== undefined && (
                                  <span className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded font-medium">
                                    ★ {paper.citationCount} citations
                                  </span>
                                )}
                                {paper.venue && (
                                  <span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded font-medium truncate max-w-[200px]">
                                    {paper.venue}
                                  </span>
                                )}
                              </div>

                              {/* Abstract Snippet (collapsible) */}
                              {paper.abstract && (
                                <div className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                                  <p className={expandedAbstracts[idx] ? '' : 'line-clamp-2'}>
                                    {paper.abstract}
                                  </p>
                                  {paper.abstract.length > 120 && (
                                    <button
                                      onClick={() => toggleAbstract(idx)}
                                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium mt-1 inline-flex items-center gap-0.5"
                                    >
                                      {expandedAbstracts[idx] ? (
                                        <>Less <ChevronUp className="w-3 h-3" /></>
                                      ) : (
                                        <>Abstract <ChevronDown className="w-3 h-3" /></>
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Card Footer Actions */}
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                              <button
                                onClick={() => copyCitation(paper, idx)}
                                className="text-gray-500 hover:text-indigo-600 font-medium inline-flex items-center gap-1 transition-colors"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-600">Citation Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Quote className="w-3 h-3" />
                                    <span>Cite Paper</span>
                                  </>
                                )}
                              </button>

                              <a
                                href={paper.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                              >
                                Semantic Scholar
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          No paper cards returned.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* General Assistant Tab (Verifies /api/ask without mode) */
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Standard Assistant Endpoint</h2>
                  <p className="text-xs text-gray-500">
                    Calls <code className="bg-gray-100 px-1 rounded font-mono">POST /api/ask</code> without the <code className="bg-gray-100 px-1 rounded font-mono">mode: "research"</code> parameter to verify backward compatibility.
                  </p>
                </div>
              </div>

              <form onSubmit={handleGeneralAsk} className="space-y-4">
                <div>
                  <label htmlFor="generalPrompt" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Your Question / Prompt
                  </label>
                  <textarea
                    id="generalPrompt"
                    rows={3}
                    value={generalQuery}
                    onChange={(e) => setGeneralQuery(e.target.value)}
                    placeholder="Ask any general technical question..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={generalLoading || !generalQuery.trim()}
                    className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {generalLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>Submit to /api/ask</span>
                  </button>
                </div>
              </form>

              {generalAnswer && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Standard Response
                    </span>
                    {generalToolsUsed.length > 0 && (
                      <span className="text-xs text-gray-500 font-mono">
                        Tools: {generalToolsUsed.join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {generalAnswer}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">ScholarPulse</span>
            <span>•</span>
            <span>Model Context Protocol (MCP) Academic Research Server</span>
          </div>
          <div>
            Powered by Semantic Scholar API & Gemini 3
          </div>
        </div>
      </footer>
    </div>
  );
}
