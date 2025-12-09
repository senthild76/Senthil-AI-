export interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
  isRead: boolean;
  isProcessed: boolean;
  status?: 'pending' | 'processing' | 'synced' | 'ignored' | 'error';
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  participants: string[];
  description?: string;
  sourceEmailId: string;
}

export interface ExtractionResult {
  isMeeting: boolean;
  title?: string;
  start?: string; // ISO string from AI
  end?: string;   // ISO string from AI
  location?: string;
  participants?: string[];
  description?: string;
}

export interface ProcessingStats {
  total: number;
  processed: number;
  meetingsFound: number;
}