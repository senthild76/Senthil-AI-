import React, { useState, useCallback, useRef } from 'react';
import { JobMatch, AgentPhase, AgentStats, FilterTab } from './types';
import { searchJobs, analyzeJobMatch } from './services/jobAgentService';
import { CANDIDATE_NAME } from './services/resumeData';
import ControlPanel from './components/ControlPanel';
import JobCard from './components/JobCard';
import JobDetailPanel from './components/JobDetailPanel';
import { Bot, Briefcase, Search, AlertTriangle } from './components/Icons';

const FILTER_LABELS: Record<FilterTab, string> = {
  all: 'All Jobs',
  'high-match': 'High Match ≥80%',
  applied: 'Applied',
};

const App: React.FC = () => {
  const [phase, setPhase] = useState<AgentPhase>('idle');
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [autoApply, setAutoApply] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [stats, setStats] = useState<AgentStats>({
    jobsFound: 0, jobsAnalyzed: 0, highMatches: 0, applied: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Track auto-apply setting at agent-start time (avoids stale closure issues)
  const autoApplyRef = useRef(autoApply);

  const startAgent = useCallback(async () => {
    autoApplyRef.current = autoApply;
    setPhase('searching');
    setError(null);
    setJobMatches([]);
    setSelectedJobId(null);
    setFilterTab('all');
    setStats({ jobsFound: 0, jobsAnalyzed: 0, highMatches: 0, applied: 0 });

    try {
      // Phase 1 — Discover jobs
      const jobs = await searchJobs();
      const initial: JobMatch[] = jobs.map(job => ({ job, status: 'queued' }));
      setJobMatches(initial);
      setStats(prev => ({ ...prev, jobsFound: jobs.length }));

      // Phase 2 — Analyze each job sequentially
      setPhase('analyzing');

      let analyzed = 0;
      let highMatches = 0;
      let applied = 0;

      for (const job of jobs) {
        // Mark as analyzing
        setJobMatches(prev =>
          prev.map(m => m.job.id === job.id ? { ...m, status: 'analyzing' } : m)
        );

        try {
          const analysis = await analyzeJobMatch(job);
          const isHighMatch = analysis.matchScore >= 80;
          const shouldApply = isHighMatch && autoApplyRef.current;

          if (isHighMatch) highMatches++;
          if (shouldApply) applied++;

          setJobMatches(prev =>
            prev.map(m =>
              m.job.id === job.id
                ? { ...m, analysis, status: shouldApply ? 'applied' : isHighMatch ? 'matched' : 'low-match' }
                : m
            )
          );

          analyzed++;
          setStats({ jobsFound: jobs.length, jobsAnalyzed: analyzed, highMatches, applied });

          // Auto-select first high-match job when it appears
          if (shouldApply && !selectedJobId) {
            setSelectedJobId(job.id);
          }

        } catch (jobErr) {
          console.error('Error analyzing job:', job.id, jobErr);
          setJobMatches(prev =>
            prev.map(m => m.job.id === job.id ? { ...m, status: 'low-match' } : m)
          );
          analyzed++;
          setStats(prev => ({ ...prev, jobsAnalyzed: analyzed }));
        }
      }

      setPhase('done');

    } catch (err) {
      console.error('Agent error:', err);
      setError(
        'The agent encountered an error. Please ensure your Gemini API key is set (API_KEY) and try again.'
      );
      setPhase('idle');
    }
  }, [autoApply]);

  const handleApply = useCallback((jobId: string) => {
    setJobMatches(prev =>
      prev.map(m => m.job.id === jobId ? { ...m, status: 'applied' } : m)
    );
    setStats(prev => ({ ...prev, applied: prev.applied + 1 }));
  }, []);

  const handleReset = useCallback(() => {
    setPhase('idle');
    setJobMatches([]);
    setSelectedJobId(null);
    setFilterTab('all');
    setStats({ jobsFound: 0, jobsAnalyzed: 0, highMatches: 0, applied: 0 });
    setError(null);
  }, []);

  // Filter logic
  const filteredJobs = jobMatches.filter(m => {
    if (filterTab === 'high-match') return m.analysis && m.analysis.matchScore >= 80;
    if (filterTab === 'applied') return m.status === 'applied';
    return true;
  });

  const tabCounts: Record<FilterTab, number> = {
    all: jobMatches.length,
    'high-match': jobMatches.filter(m => m.analysis && m.analysis.matchScore >= 80).length,
    applied: jobMatches.filter(m => m.status === 'applied').length,
  };

  const selectedMatch = jobMatches.find(m => m.job.id === selectedJobId) ?? null;

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">

      {/* ── Header ── */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Bot size={17} />
          </div>
          <div className="leading-tight">
            <h1 className="font-black text-slate-900 text-base tracking-tight">LinkedIn Job Agent</h1>
            <p className="text-[11px] text-slate-400 font-medium">Powered by Gemini AI • {CANDIDATE_NAME}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {phase === 'done' && stats.highMatches > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold">
              ✓ {stats.highMatches} high-match job{stats.highMatches !== 1 ? 's' : ''} found
              {stats.applied > 0 && ` • ${stats.applied} applied`}
            </div>
          )}
          {phase === 'done' && stats.highMatches === 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold">
              {stats.jobsFound} jobs analyzed • refine search to find better matches
            </div>
          )}
          <span className="text-xs text-slate-400 hidden sm:block">Singapore • Investment Banking</span>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Control Panel */}
        <ControlPanel
          phase={phase}
          stats={stats}
          autoApply={autoApply}
          onAutoApplyChange={setAutoApply}
          onStart={startAgent}
          onReset={handleReset}
        />

        {/* Center: Job List */}
        <div className="w-96 shrink-0 border-r border-slate-200 flex flex-col bg-white">

          {/* Filter Tabs — only show once jobs loaded */}
          {jobMatches.length > 0 && (
            <div className="flex border-b border-slate-200 bg-white shrink-0">
              {(Object.keys(FILTER_LABELS) as FilterTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-bold transition-colors border-b-2 ${
                    filterTab === tab
                      ? 'text-blue-700 border-blue-600 bg-blue-50/60'
                      : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab === 'high-match' ? '≥80%' : 'Applied'}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    filterTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {tabCounts[tab]}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Job Cards List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Idle state */}
            {phase === 'idle' && !error && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
                  <Briefcase size={26} className="text-blue-500" />
                </div>
                <h3 className="font-bold text-slate-700 mb-2">Ready to Search</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Click <strong>Start Job Agent</strong> to discover matching LinkedIn jobs in
                  Singapore's investment banking sector and auto-apply to the best matches.
                </p>
              </div>
            )}

            {/* Searching state (no jobs yet) */}
            {phase === 'searching' && jobMatches.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 animate-pulse">
                  <Search size={20} className="text-blue-500" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Scanning LinkedIn for matching roles…</p>
                <p className="text-xs text-slate-400 mt-1">Searching Singapore's investment banking sector</p>
              </div>
            )}

            {/* Job cards */}
            {filteredJobs.map(jobMatch => (
              <JobCard
                key={jobMatch.job.id}
                jobMatch={jobMatch}
                isSelected={selectedJobId === jobMatch.job.id}
                onClick={() => setSelectedJobId(jobMatch.job.id)}
              />
            ))}

            {/* Empty filtered state */}
            {phase === 'done' && filteredJobs.length === 0 && (
              <div className="text-center py-10 text-sm text-slate-400">
                No jobs in this category.
              </div>
            )}
          </div>
        </div>

        {/* Right: Job Detail */}
        <div className="flex-1 overflow-hidden bg-slate-50">
          {selectedMatch ? (
            <JobDetailPanel jobMatch={selectedMatch} onApply={handleApply} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="w-24 h-24 bg-white border-2 border-slate-200 rounded-3xl flex items-center justify-center mb-5 shadow-sm">
                <Bot size={40} className="text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-500 text-lg mb-2">
                {phase === 'idle' ? 'Start the Agent' : 'Select a Job'}
              </h3>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                {phase === 'idle'
                  ? 'The agent will discover jobs matching your 20+ year investment banking profile, score each against your resume, generate tailored cover letters, and auto-apply to the best matches.'
                  : 'Click any job in the list to see the full AI match analysis, matched skills, skill gaps, and your tailored cover letter.'
                }
              </p>
              {phase === 'analyzing' && jobMatches.some(m => m.analysis && m.analysis.matchScore >= 80) && (
                <p className="text-xs text-emerald-600 font-semibold mt-4 animate-pulse">
                  ✓ High-match jobs found — click to review
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
