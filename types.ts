// --- Existing Email/Calendar Types (kept for reference) ---
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
  start?: string;
  end?: string;
  location?: string;
  participants?: string[];
  description?: string;
}

export interface ProcessingStats {
  total: number;
  processed: number;
  meetingsFound: number;
}

// --- LinkedIn Job Agent Types ---

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  niceToHave: string[];
  salaryRange: string;
  jobType: string;
  linkedinUrl: string;
  applyType: string;
  isRemote: boolean;
  postedDaysAgo: number;
  applicantCount: number;
  experienceLevel: string;
  industry: string;
}

export interface JobAnalysis {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchReason: string;
  recommendation: string;
  keyStrengths: string[];
  coverLetter: string;
}

export interface JobMatch {
  job: JobListing;
  analysis?: JobAnalysis;
  status: 'queued' | 'analyzing' | 'matched' | 'low-match' | 'applied' | 'skipped';
}

export interface AgentStats {
  jobsFound: number;
  jobsAnalyzed: number;
  highMatches: number;
  applied: number;
}

export type AgentPhase = 'idle' | 'searching' | 'analyzing' | 'done';
export type FilterTab = 'all' | 'high-match' | 'applied';
