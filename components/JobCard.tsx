import React from 'react';
import { JobMatch } from '../types';
import { MapPin, Clock, Zap, Loader, CheckCircle, Users } from './Icons';

interface Props {
  jobMatch: JobMatch;
  isSelected: boolean;
  onClick: () => void;
}

const getScoreBadgeStyle = (score: number): string => {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

const getCardBorderStyle = (jobMatch: JobMatch, isSelected: boolean): string => {
  if (isSelected) return 'border-blue-500 bg-blue-50 shadow-md';
  if (jobMatch.status === 'applied') return 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-400';
  if (jobMatch.analysis && jobMatch.analysis.matchScore >= 80) return 'border-emerald-200 bg-white hover:border-emerald-300 hover:shadow-sm';
  return 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm';
};

const JobCard: React.FC<Props> = ({ jobMatch, isSelected, onClick }) => {
  const { job, analysis, status } = jobMatch;
  const isAnalyzing = status === 'analyzing';
  const isQueued = status === 'queued';

  return (
    <div
      onClick={onClick}
      className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${getCardBorderStyle(jobMatch, isSelected)}`}
    >
      {/* Title + Score */}
      <div className="flex justify-between items-start gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{job.title}</h3>
        </div>
        <div className="shrink-0 mt-0.5">
          {isAnalyzing && (
            <div className="flex items-center gap-1 text-blue-500 text-xs font-medium">
              <Loader size={11} className="animate-spin" />
              <span>AI</span>
            </div>
          )}
          {isQueued && (
            <span className="text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
              Queued
            </span>
          )}
          {analysis && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreBadgeStyle(analysis.matchScore)}`}>
              {analysis.matchScore}%
            </span>
          )}
        </div>
      </div>

      {/* Company */}
      <p className="text-sm font-semibold text-slate-600 mb-2">{job.company}</p>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
        <span className="flex items-center gap-1">
          <MapPin size={11} />
          {job.location}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {job.postedDaysAgo}d ago
        </span>
        <span className="flex items-center gap-1">
          <Users size={11} />
          {job.applicantCount}
        </span>
        {job.applyType === 'Easy Apply' && (
          <span className="flex items-center gap-1 text-blue-600 font-semibold">
            <Zap size={11} />
            Easy Apply
          </span>
        )}
      </div>

      {/* Bottom status row */}
      {analysis && (
        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
          <span className={`text-xs font-semibold ${
            analysis.matchScore >= 80 ? 'text-emerald-600' :
            analysis.matchScore >= 60 ? 'text-amber-600' : 'text-slate-400'
          }`}>
            {analysis.recommendation === 'Apply' ? '✓ Strong Match' :
             analysis.recommendation === 'Consider' ? '~ Partial Match' : '✗ Low Match'}
          </span>
          {status === 'applied' && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
              <CheckCircle size={12} /> Applied
            </span>
          )}
          {status === 'matched' && (
            <span className="text-xs text-blue-600 font-medium">Ready to Apply</span>
          )}
        </div>
      )}
    </div>
  );
};

export default JobCard;
