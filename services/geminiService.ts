import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult } from '../types';

// Initialize Gemini Client
// In a production app, this should be handled more securely or via a backend proxy
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const extractMeetingDetails = async (emailBody: string, emailSubject: string, emailFrom: string): Promise<ExtractionResult> => {
  const currentIso = new Date().toISOString();

  const prompt = `
    Current Time (ISO): ${currentIso}
    
    Analyze the following email and determine if it contains a meeting invitation or scheduling request.
    If it is a meeting, extract the details.
    
    Rules:
    1. 'isMeeting' should be true ONLY if there is a clear intent to meet at a specific time or a request to book a slot that is confirmed in the text.
    2. Convert all relative dates (e.g., "tomorrow", "next Friday") to absolute ISO 8601 strings based on the Current Time provided above.
    3. If no end time is specified, assume a duration of 1 hour.
    4. Extract participant names or emails if available.
    
    Email Subject: ${emailSubject}
    Email Sender: ${emailFrom}
    Email Body:
    ${emailBody}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isMeeting: { type: Type.BOOLEAN },
            title: { type: Type.STRING, description: "A concise title for the calendar event" },
            start: { type: Type.STRING, description: "ISO 8601 Start Date Time" },
            end: { type: Type.STRING, description: "ISO 8601 End Date Time" },
            location: { type: Type.STRING },
            participants: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            description: { type: Type.STRING, description: "Short summary of the meeting agenda" }
          },
          required: ['isMeeting']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ExtractionResult;
    }
    
    throw new Error("No response text from Gemini");

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    // Fallback in case of error
    return { isMeeting: false };
  }
};
