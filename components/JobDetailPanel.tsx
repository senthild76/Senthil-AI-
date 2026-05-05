import React, { useState } from 'react';
import { JobMatch } from '../types';
import {
  MapPin, Clock, Users, DollarSign, ExternalLink,
  Copy, CheckCircle, FileText, Star, Target,
  Briefcase, Zap, Info, Loader,
} from './Icons';

interface Props {
  jobMatch: JobMatch;
  onApply: (jobId: string) => void;
}

const scoreRingColor = (score: number): string => {
  if (score >= 80) return 'border-emerald-400 text-emerald-600';
  if (score >= 60) return 'border-amber-400 text-amber-600';
  return 'border-red-400 text-red-500';
};

const scoreBgGradient = (score: number): string => {
  if (score >= 80) return 'from-emerald-50 to-emerald-100/60';
  if (score >= 60) return 'from-amber-50 to-amber-100/60';
  return 'from-red-50 to-red-100/60';
};

const JobDetailPanel: React.FC<Props> = ({ jobMatch, onApply }) => {
  const { job, analysis, status } = jobMatch;
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select textarea
    }
  };

  const handleApply = () => {
    window.open(job.linkedinUrl, '_blank', 'noopener,noreferrer');
    onApply(job.id);
  };

  const isAnalyzing = status === 'analyzing';
  const isApplied = status === 'applied';
  const canApply = analysis && analysis.matchScore >= 80 && !isApplied;

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{job.title}</h2>
            <p className="text-base font-semibold text-slate-600 mt-0.5">{job.company}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
              <span className="flex items-center gap-1"><Clock size={12} />{job.postedDaysAgo}d ago</span>
              <span className="flex items-center gap-1"><Users size={12} />{job.applicantCount} applicants</span>
              {job.salaryRange && (
                <span className="flex items-center gap-1"><DollarSign size={12} />{job.salaryRange}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                job.applyType === 'Easy Apply'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {job.applyType === 'Easy Apply' ? '⚡ Easy Apply' : job.applyType}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{job.jobType}</span>
              {job.isRemote && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Remote</span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{job.experienceLevel}</span>
            </div>
          </div>

          {/* Match Score Ring */}
          {analysis ? (
            <div className={`shrink-0 w-20 h-20 rounded-full border-4 bg-gradient-to-br flex flex-col items-center justify-center ${scoreRingColor(analysis.matchScore)} ${scoreBgGradient(analysis.matchScore)}`}>
              <span className={`text-2xl font-black leading-none ${analysis.matchScore >= 80 ? 'text-emerald-600' : analysis.matchScore >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                {analysis.matchScore}%
              </span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Match</span>
            </div>
          ) : isAnalyzing ? (
            <div className="shrink-0 w-20 h-20 rounded-full border-4 border-blue-200 bg-blue-50 flex flex-col items-center justify-center">
              <Loader size={20} className="text-blue-500 animate-spin" />
              <span className="text-[9px] text-blue-400 font-medium mt-1">Analyzing</span>
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <a
            href={job.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ExternalLink size={13} /> View on LinkedIn
          </a>

          {canApply && (
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Zap size={13} /> Apply Now (80%+ Match)
            </button>
          )}

          {isApplied && (
            <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
              <CheckCircle size={13} /> Application Prepared & Sent
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-6">

        {/* AI Notice Banner */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>
            <strong>How this works:</strong> Jobs are AI-discovered based on your resume profile.
            "Apply Now" opens the LinkedIn job page — review the listing and submit your application directly.
            Your AI-generated cover letter is ready below.
          </span>
        </div>

        {/* AI Match Analysis */}
        {analysis && (
          <section>
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Target size={15} className="text-blue-600" />
              AI Match Analysis
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed bg-white border border-slate-200 rounded-lg p-3 mb-4">
              {analysis.matchReason}
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Matched Skills */}
              <div>
                <h4 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2">
                  ✓ Matched Skills ({analysis.matchedSkills.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.matchedSkills.map((skill, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Skill Gaps */}
              <div>
                <h4 className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-2">
                  ✗ Skill Gaps ({analysis.missingSkills.length})
                </h4>
                {analysis.missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {analysis.missingSkills.map((skill, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-200 font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 font-medium">No significant gaps identified ✓</p>
                )}
              </div>
            </div>

            {/* Key Strengths */}
            {analysis.keyStrengths.length > 0 && (
              <div className="mt-4 bg-white border border-slate-200 rounded-lg p-3">
                <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Star size={11} /> Why You Stand Out
                </h4>
                <ul className="space-y-1.5">
                  {analysis.keyStrengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="text-blue-400 font-bold mt-0.5 shrink-0">→</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="flex items-center gap-3 py-6 justify-center text-blue-500">
            <Loader size={20} className="animate-spin" />
            <span className="text-sm font-medium">AI is analyzing your match for this role...</span>
          </div>
        )}

        {/* Job Description */}
        <section>
          <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <Briefcase size={15} className="text-slate-500" />
            About the Role
          </h3>
          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-white border border-slate-200 rounded-lg p-4">
            {job.description}
          </div>
        </section>

        {/* Requirements */}
        <section>
          <h3 className="font-bold text-slate-800 text-sm mb-3">Must-Have Requirements</h3>
          <ul className="space-y-2">
            {job.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className={`shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  analysis?.matchedSkills.some(s =>
                    s.toLowerCase().split(' ').some(w => w.length > 3 && req.toLowerCase().includes(w))
                  )
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {i + 1}
                </span>
                {req}
              </li>
            ))}
          </ul>
        </section>

        {/* Nice to Have */}
        {job.niceToHave?.length > 0 && (
          <section>
            <h3 className="font-bold text-slate-800 text-sm mb-3">Nice to Have</h3>
            <ul className="space-y-1.5">
              {job.niceToHave.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                  <span className="text-slate-300 mt-0.5">○</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Cover Letter */}
        {analysis?.coverLetter && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileText size={15} className="text-indigo-600" />
                AI-Generated Cover Letter
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCoverLetter(v => !v)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  {showCoverLetter ? 'Hide' : 'Show'}
                </button>
                {showCoverLetter && (
                  <button
                    onClick={() => copyToClipboard(analysis.coverLetter)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {copied
                      ? <><CheckCircle size={12} className="text-emerald-500" /> Copied!</>
                      : <><Copy size={12} /> Copy</>
                    }
                  </button>
                )}
              </div>
            </div>

            {showCoverLetter && (
              <div className="bg-white border border-indigo-200 rounded-lg p-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-mono text-xs shadow-sm">
                {analysis.coverLetter}
              </div>
            )}

            {!showCoverLetter && (
              <div
                onClick={() => setShowCoverLetter(true)}
                className="bg-indigo-50 border border-dashed border-indigo-200 rounded-lg p-3 text-center cursor-pointer hover:bg-indigo-100 transition-colors"
              >
                <p className="text-xs text-indigo-600 font-medium">Click to view your tailored cover letter</p>
                <p className="text-[10px] text-indigo-400 mt-0.5">Personalized for {job.title} at {job.company}</p>
              </div>
            )}
          </section>
        )}

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </div>
  );
};

export default JobDetailPanel;
