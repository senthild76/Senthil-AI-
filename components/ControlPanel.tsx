import React from 'react';
import { AgentPhase, AgentStats, SearchConfig } from '../types';
import { Bot, Loader, Briefcase, Target, Send, TrendingUp, Award } from './Icons';
import {
  CANDIDATE_NAME,
  CANDIDATE_EMAIL,
  KEY_SKILLS_TAGS,
  TARGET_ROLES,
} from '../services/resumeData';

const LOCATIONS = [
  'Singapore',
  'Hong Kong',
  'London',
  'New York',
  'Sydney',
  'Tokyo',
  'Dubai',
  'Mumbai',
];

const SENIORITY_LEVELS = [
  'Director / VP / AVP',
  'Managing Director',
  'Director',
  'Vice President (VP)',
  'Assistant Vice President (AVP)',
  'Senior Manager',
  'Manager',
];

interface Props {
  phase: AgentPhase;
  stats: AgentStats;
  config: SearchConfig;
  onConfigChange: (config: SearchConfig) => void;
  autoApply: boolean;
  onAutoApplyChange: (val: boolean) => void;
  onStart: () => void;
  onReset: () => void;
}

const selectClass = `
  w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700
  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
  cursor-pointer appearance-none
  bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")]
  bg-no-repeat bg-[right_0.5rem_center]
`;

const ControlPanel: React.FC<Props> = ({
  phase, stats, config, onConfigChange, autoApply, onAutoApplyChange, onStart, onReset,
}) => {
  const isRunning = phase === 'searching' || phase === 'analyzing';
  const isDone = phase === 'done';

  const phaseLabel = phase === 'searching'
    ? 'Discovering jobs on LinkedIn…'
    : phase === 'analyzing'
    ? `Analyzing match ${stats.jobsAnalyzed} of ${stats.jobsFound}…`
    : null;

  return (
    <aside className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-y-auto">

      {/* Candidate Card */}
      <div className="p-5 border-b border-slate-100">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-black text-lg shadow mb-3">
          SK
        </div>
        <h2 className="font-bold text-slate-900 text-sm leading-tight">{CANDIDATE_NAME}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{CANDIDATE_EMAIL}</p>
        <p className="text-xs text-slate-400 mt-0.5">20+ yrs exp • Investment Banking</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {KEY_SKILLS_TAGS.slice(0, 8).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded font-semibold">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Search Configuration */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Search Configuration</h3>

        {/* Location Dropdown */}
        <div>
          <label className="text-xs text-slate-500 font-semibold block mb-1.5">
            📍 Location
          </label>
          <select
            value={config.location}
            onChange={e => onConfigChange({ ...config, location: e.target.value })}
            disabled={isRunning}
            className={selectClass}
          >
            {LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Seniority Dropdown */}
        <div>
          <label className="text-xs text-slate-500 font-semibold block mb-1.5">
            🎖 Seniority Level
          </label>
          <select
            value={config.seniority}
            onChange={e => onConfigChange({ ...config, seniority: e.target.value })}
            disabled={isRunning}
            className={selectClass}
          >
            {SENIORITY_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* Target Roles */}
        <div>
          <label className="text-xs text-slate-500 font-semibold block mb-1.5">🎯 Target Roles</label>
          <ul className="space-y-1">
            {TARGET_ROLES.slice(0, 5).map(role => (
              <li key={role} className="flex items-start gap-1.5 text-xs text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                {role}
              </li>
            ))}
          </ul>
        </div>

        {/* Auto-Apply Toggle */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-sm font-semibold text-slate-700">Auto-Apply</p>
            <p className="text-xs text-slate-400 leading-tight">Flags ≥80% match jobs<br />& opens application</p>
          </div>
          <button
            onClick={() => onAutoApplyChange(!autoApply)}
            disabled={isRunning}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
              autoApply ? 'bg-blue-600' : 'bg-slate-300'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
              autoApply ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Start / Status */}
      <div className="p-5 border-b border-slate-100">
        {phase === 'idle' && (
          <button
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors shadow-sm"
          >
            <Bot size={16} />
            Start Job Agent
          </button>
        )}

        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center text-blue-600 py-1">
              <Loader size={15} className="animate-spin" />
              <span className="text-sm font-semibold">{phaseLabel}</span>
            </div>
            {stats.jobsFound > 0 && (
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.jobsAnalyzed / stats.jobsFound) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {isDone && (
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            <Bot size={16} />
            Run Agent Again
          </button>
        )}
      </div>

      {/* Stats Panel */}
      {phase !== 'idle' && (
        <div className="p-5">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Agent Results</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Jobs Found', value: stats.jobsFound, icon: <Briefcase size={13} />, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
              { label: 'Analyzed', value: stats.jobsAnalyzed, icon: <Target size={13} />, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
              { label: 'High Match', value: stats.highMatches, icon: <TrendingUp size={13} />, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Applied', value: stats.applied, icon: <Send size={13} />, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 border ${s.bg}`}>
                <div className={`flex items-center gap-1.5 mb-1 ${s.color}`}>
                  {s.icon}
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{s.label}</span>
                </div>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {stats.jobsAnalyzed > 0 && (
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Award size={11} /> Match Rate
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  {Math.round((stats.highMatches / stats.jobsAnalyzed) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${(stats.highMatches / Math.max(stats.jobsAnalyzed, 1)) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {stats.highMatches} of {stats.jobsAnalyzed} jobs qualify for application
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto p-4 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Jobs are AI-discovered based on your profile. Auto-apply prepares your cover letter and opens LinkedIn for ≥80% matches.
        </p>
      </div>
    </aside>
  );
};

export default ControlPanel;
