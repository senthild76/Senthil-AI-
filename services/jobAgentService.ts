import { GoogleGenAI, Type } from "@google/genai";
import { JobListing, JobAnalysis } from '../types';
import { RESUME_TEXT } from './resumeData';

const getClient = (apiKey: string) =>
  new GoogleGenAI({ apiKey: apiKey || (process.env.API_KEY as string) || '' });

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 5): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const is503 = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand');
      if (is503 && attempt < maxAttempts) {
        const delay = Math.min(2000 * 2 ** (attempt - 1), 30000);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retry attempts exceeded');
}

/**
 * Uses Gemini AI to discover realistic LinkedIn job listings for Singapore's
 * investment banking sector that align with the candidate's profile.
 *
 * NOTE: LinkedIn does not provide a public job search API. This agent uses
 * AI to simulate job discovery and generate realistic listings. Users should
 * also search linkedin.com/jobs directly using the search queries below.
 */
export const searchJobs = async (apiKey: string, location: string, seniority: string): Promise<JobListing[]> => {
  const ai = getClient(apiKey);
  const prompt = `
You are an expert LinkedIn recruiter and job search agent specializing in the global
financial services and investment banking sector.

Generate exactly 12 realistic LinkedIn job listings for the following senior IT candidate.
These should be jobs that genuinely exist in the target location's banking/finance sector right now.

CANDIDATE PROFILE:
${RESUME_TEXT}

SEARCH CRITERIA:
- Location: ${location}
- Seniority Level: ${seniority}

REQUIREMENTS FOR JOB LISTINGS:
1. Generate from real banks/financial institutions operating in ${location}, e.g. major
   global investment banks, local/regional banks, asset managers, and FinTechs in that city.

2. Role types (mix these) at ${seniority} level:
   - Production Technology / Application Support
   - SRE Lead / Manager
   - Front Office Technology Support (Rates, Credit, FX, Equities)
   - Market Data Infrastructure Manager
   - IT Service Continuity / DR Lead
   - Risk Technology Support Lead
   - Platform Engineering / DevOps Lead (Financial Services)

3. Salary ranges realistic for ${seniority} level in ${location}.

4. Mix of match levels so the analysis is interesting:
   - 4 jobs should be excellent matches (will score 80-95%)
   - 4 jobs should be good matches (will score 60-79%)
   - 4 jobs should be lower matches (will score 40-59%)

5. LinkedIn URLs format: https://www.linkedin.com/jobs/view/{7-8 digit number}

6. Mix of "Easy Apply" and "External" apply types.

7. Job IDs: use format "job-1" through "job-12"

8. Each job description should be 2-3 detailed paragraphs describing responsibilities and team context.

9. Requirements: 6-10 specific bullet points per job.

10. Ensure variety in: experience level required, team size, specific tech stack, regulatory focus.

Today's date: ${new Date().toISOString().split('T')[0]}
`;

  const response = await withRetry(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          jobs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                company: { type: Type.STRING },
                location: { type: Type.STRING },
                description: { type: Type.STRING },
                requirements: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                niceToHave: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                salaryRange: { type: Type.STRING },
                jobType: { type: Type.STRING },
                linkedinUrl: { type: Type.STRING },
                applyType: { type: Type.STRING },
                isRemote: { type: Type.BOOLEAN },
                postedDaysAgo: { type: Type.NUMBER },
                applicantCount: { type: Type.NUMBER },
                experienceLevel: { type: Type.STRING },
                industry: { type: Type.STRING },
              },
              required: [
                'id', 'title', 'company', 'location', 'description',
                'requirements', 'niceToHave', 'salaryRange', 'jobType',
                'linkedinUrl', 'applyType', 'isRemote', 'postedDaysAgo',
                'applicantCount', 'experienceLevel', 'industry',
              ],
            },
          },
        },
        required: ['jobs'],
      },
    },
  }));

  if (!response.text) throw new Error('No response from Gemini for job search');
  const data = JSON.parse(response.text);
  return data.jobs as JobListing[];
};

/**
 * Uses Gemini AI to analyze how well the candidate matches a job listing.
 * Returns a detailed match analysis including score, matched/gap skills, and cover letter.
 */
export const analyzeJobMatch = async (job: JobListing, apiKey: string): Promise<JobAnalysis> => {
  const ai = getClient(apiKey);
  const prompt = `
You are an expert career advisor and ATS (Applicant Tracking System) specialist.
Analyze the match between this candidate and the job posting with precision and honesty.

CANDIDATE RESUME:
${RESUME_TEXT}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Experience Level: ${job.experienceLevel}

Job Description:
${job.description}

Must-Have Requirements:
${job.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Nice-to-Have:
${job.niceToHave?.length ? job.niceToHave.map((r, i) => `${i + 1}. ${r}`).join('\n') : 'Not specified'}

ANALYSIS INSTRUCTIONS:
1. matchScore: Integer 0-100. Weight must-have requirements heavily.
   - 80-100: Candidate strongly meets most requirements
   - 60-79: Good partial match, some gaps
   - 40-59: Partial match, notable gaps
   - Below 40: Significant gaps

2. matchedSkills: Specific skills, tools, or experiences from the job requirements that the candidate demonstrably has.
   Be specific (e.g., "10+ years Fidessa OMS support" not just "trading")

3. missingSkills: Requirements the candidate clearly lacks or has no demonstrated experience with.
   Be honest — if there are no gaps, return empty array.

4. matchReason: 2-3 sentences explaining the score. Be specific about what drives the score up or down.

5. recommendation: "Apply" if score >= 80, "Consider" if score 60-79, "Skip" if score < 60.

6. keyStrengths: 4-5 specific, compelling strengths the candidate brings. Reference actual achievements from resume.

7. coverLetter: If score >= 60, write a professional, tailored cover letter (3-4 paragraphs):
   - Opening: Express genuine interest in ${job.title} at ${job.company}, mention specific attraction to the role
   - Body 1: Highlight most relevant experience matching key requirements
   - Body 2: Specific achievements that demonstrate value to this team
   - Closing: Strong close with call to action
   - Sign with: "Senthil Kumar Damodaran"
   If score < 60, return empty string.
`;

  const response = await withRetry(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchScore: { type: Type.NUMBER },
          matchedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          matchReason: { type: Type.STRING },
          recommendation: { type: Type.STRING },
          keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          coverLetter: { type: Type.STRING },
        },
        required: [
          'matchScore', 'matchedSkills', 'missingSkills',
          'matchReason', 'recommendation', 'keyStrengths', 'coverLetter',
        ],
      },
    },
  }));

  if (!response.text) throw new Error('No response from Gemini for job analysis');
  return JSON.parse(response.text) as JobAnalysis;
};
