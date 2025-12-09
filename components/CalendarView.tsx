import React from 'react';
import { CalendarEvent } from '../types';
import { formatTime } from '../utils/dateUtils';
import { Calendar as CalendarIcon, MapPin, Users, Clock } from './Icons';

interface CalendarViewProps {
  events: CalendarEvent[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
  // Simple layout: Group events by day for list view within the calendar panel
  const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-white shadow-sm z-10">
        <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">
          <CalendarIcon className="text-indigo-600" />
          My Calendar
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Automatically updated from your inbox.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {sortedEvents.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <CalendarIcon size={64} className="mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-600">Your schedule is empty</p>
              <p className="text-sm text-slate-400">Run the auto-sync to populate events from your email.</p>
            </div>
          ) : (
            sortedEvents.map((event) => (
              <div 
                key={event.id} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow border-l-4 border-l-indigo-500"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 mb-1">{event.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon size={14} className="text-slate-400" />
                        <span className="font-medium text-slate-700">
                          {event.start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        <span>
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded font-medium border border-indigo-100">
                    Auto-Synced
                  </span>
                </div>

                <div className="space-y-2 mt-2 pt-3 border-t border-slate-100">
                  {event.location && (
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin size={15} className="mt-0.5 text-slate-400 shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.participants.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <Users size={15} className="mt-0.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{event.participants.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;