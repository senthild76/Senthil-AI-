import React from 'react';
import { Email } from '../types';
import { formatDate } from '../utils/dateUtils';
import { Mail, CheckCircle, XCircle, RefreshCw, Sparkles } from './Icons';

interface EmailListProps {
  emails: Email[];
  onSelectEmail: (email: Email) => void;
  selectedEmailId: string | null;
}

const EmailList: React.FC<EmailListProps> = ({ emails, onSelectEmail, selectedEmailId }) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-full md:w-96 shrink-0">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Mail size={18} />
          Inbox
        </h2>
        <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
          {emails.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => onSelectEmail(email)}
            className={`
              p-4 border-b border-slate-100 cursor-pointer transition-colors duration-200 relative
              ${selectedEmailId === email.id ? 'bg-blue-50' : 'hover:bg-slate-50'}
              ${!email.isRead ? 'font-medium' : ''}
            `}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`text-sm ${selectedEmailId === email.id ? 'text-blue-900' : 'text-slate-900'} truncate font-semibold`}>
                {email.from}
              </span>
              <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                {formatDate(email.receivedAt)}
              </span>
            </div>
            
            <div className="text-sm text-slate-700 truncate mb-1">
              {email.subject}
            </div>
            
            <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {email.body}
            </div>

            {/* Status Indicators */}
            <div className="absolute top-4 right-4">
              {email.status === 'processing' && (
                <RefreshCw size={14} className="text-blue-500 animate-spin" />
              )}
              {email.status === 'synced' && (
                <div className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                   <CheckCircle size={10} /> Synced
                </div>
              )}
              {email.status === 'ignored' && (
                <div className="flex items-center gap-1 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                   Ignored
                </div>
              )}
               {/* Unread Indicator */}
               {!email.isRead && email.status === 'pending' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 ml-auto"></div>
              )}
            </div>
          </div>
        ))}
        
        {emails.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            No emails found.
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailList;