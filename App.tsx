import React, { useState, useEffect, useCallback } from 'react';
import EmailList from './components/EmailList';
import CalendarView from './components/CalendarView';
import { extractMeetingDetails } from './services/geminiService';
import { Email, CalendarEvent, ProcessingStats } from './types';
import { getRelativeDate } from './utils/dateUtils';
import { Sparkles, RefreshCw } from './components/Icons';

// --- Mock Data Setup ---
const generateMockEmails = (): Email[] => {
  const today = new Date();
  return [
    {
      id: 'e1',
      from: 'sarah.manager@techcorp.com',
      subject: 'Quarterly Review Meeting',
      body: 'Hi there, can we meet next Monday at 10:00 AM to discuss the Q3 results? We will need about an hour. We will meet in Conference Room B. I will invite John and Mike as well.',
      receivedAt: new Date(today.getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
      isRead: false,
      isProcessed: false,
      status: 'pending'
    },
    {
      id: 'e2',
      from: 'newsletter@devweekly.com',
      subject: 'Weekly Developer News - React 19 is coming!',
      body: 'Here are the top stories for this week. 1. React Server Components. 2. Tailwind v4. No meetings here, just news!',
      receivedAt: new Date(today.getTime() - 1000 * 60 * 60 * 5),
      isRead: false,
      isProcessed: false,
      status: 'pending'
    },
    {
      id: 'e3',
      from: 'alex.design@creative.studio',
      subject: 'Coffee catchup?',
      body: 'Hey! Long time no see. Are you free to grab a coffee at The Grind tomorrow at 2pm? Just a quick 30 min chat to catch up.',
      receivedAt: new Date(today.getTime() - 1000 * 60 * 60 * 24),
      isRead: true,
      isProcessed: false,
      status: 'pending'
    },
    {
      id: 'e4',
      from: 'billing@cloudservice.net',
      subject: 'Invoice #44021 Payment Confirmation',
      body: 'Thank you for your payment of $49.00. Your transaction ID is TX999222. See attached PDF.',
      receivedAt: new Date(today.getTime() - 1000 * 60 * 60 * 26),
      isRead: true,
      isProcessed: false,
      status: 'pending'
    },
    {
        id: 'e5',
        from: 'recruiter@hiring.io',
        subject: 'Interview Schedule - Frontend Engineer',
        body: 'We are excited to move forward. Could you do a technical interview next Wednesday at 4 PM PST? It will be a Google Meet link. Expect 90 minutes.',
        receivedAt: new Date(today.getTime() - 1000 * 60 * 60 * 48),
        isRead: false,
        isProcessed: false,
        status: 'pending'
    }
  ];
};

const App: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState<ProcessingStats>({ total: 0, processed: 0, meetingsFound: 0 });

  // Initialize Data
  useEffect(() => {
    setEmails(generateMockEmails());
  }, []);

  const handleSelectEmail = (email: Email) => {
    setSelectedEmailId(email.id);
    if (!email.isRead) {
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
    }
  };

  const scanInbox = useCallback(async () => {
    if (isScanning) return;
    setIsScanning(true);
    
    // Filter pending emails
    const pendingEmails = emails.filter(e => !e.isProcessed);
    
    let processedCount = stats.processed;
    let meetingsCount = stats.meetingsFound;

    // Process sequentially to visualize progress
    for (const email of pendingEmails) {
      // Set status to processing
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, status: 'processing' } : e));
      
      try {
        // Call Gemini
        const result = await extractMeetingDetails(email.body, email.subject, email.from);
        
        if (result.isMeeting && result.start && result.end) {
            // Create Calendar Event
            const newEvent: CalendarEvent = {
                id: `evt-${Date.now()}-${Math.random()}`,
                title: result.title || 'Untitled Meeting',
                start: new Date(result.start),
                end: new Date(result.end),
                location: result.location,
                participants: result.participants || [email.from],
                description: result.description || email.body.substring(0, 100) + '...',
                sourceEmailId: email.id
            };
            
            setEvents(prev => [...prev, newEvent]);
            setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isProcessed: true, status: 'synced' } : e));
            meetingsCount++;
        } else {
            setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isProcessed: true, status: 'ignored' } : e));
        }

      } catch (err) {
          console.error("Error processing email", email.id, err);
          setEmails(prev => prev.map(e => e.id === email.id ? { ...e, status: 'error' } : e));
      }
      
      processedCount++;
      setStats({
          total: emails.length,
          processed: processedCount,
          meetingsFound: meetingsCount
      });
      
      // Artificial delay for UX so user can see it happening
      await new Promise(r => setTimeout(r, 800));
    }
    
    setIsScanning(false);
  }, [emails, isScanning, stats]);

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Sparkles size={18} />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">AutoCal <span className="text-indigo-600">Sync</span></h1>
        </div>

        <div className="flex items-center gap-4">
             {/* Stats Pill */}
             {(stats.processed > 0) && (
                 <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                    {stats.processed} Processed • {stats.meetingsFound} Synced
                 </div>
             )}

            <button
                onClick={scanInbox}
                disabled={isScanning || emails.every(e => e.isProcessed)}
                className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm
                    ${isScanning 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-100'
                    }
                `}
            >
                <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
                {isScanning ? 'Scanning Inbox...' : 'Scan & Sync Calendar'}
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Email Sidebar */}
        <EmailList 
            emails={emails} 
            onSelectEmail={handleSelectEmail} 
            selectedEmailId={selectedEmailId} 
        />

        {/* Detail/Calendar Area */}
        <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
            {/* If an email is selected, show it on mobile, but here we do split view default for desktop */}
            
            {/* Calendar Overlay / Main View */}
             <CalendarView events={events} />

             {/* Simple Detail Panel Overlay (Optional context) */}
             {selectedEmail && (
                 <div className="absolute bottom-6 right-6 w-96 bg-white rounded-xl shadow-xl border border-slate-200 p-5 z-30 animate-in slide-in-from-bottom-4 duration-300">
                     <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-slate-800">Email Preview</h3>
                        <button onClick={() => setSelectedEmailId(null)} className="text-slate-400 hover:text-slate-600">
                            Close
                        </button>
                     </div>
                     <p className="text-sm font-semibold text-slate-900 mb-1">{selectedEmail.subject}</p>
                     <p className="text-xs text-slate-500 mb-3">From: {selectedEmail.from}</p>
                     <p className="text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
                         {selectedEmail.body}
                     </p>
                     
                     {selectedEmail.status === 'synced' && (
                         <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-green-600 text-sm font-medium">
                             <Sparkles size={14} />
                             Event created successfully
                         </div>
                     )}
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default App;