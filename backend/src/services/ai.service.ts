// AI Service - Google AI (Gemini)

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Local type definition for chat messages
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// System prompt for the AI assistant
const AI_ASSISTANT_SYSTEM_PROMPT = `You are an AI assistant for STANNEL - a loyalty management platform for architects and suppliers in the construction/design industry in Israel.

Your role is to help users understand how to use the system.

The platform includes the following features:
- Uploading and managing invoices from suppliers
- Earning points and cash rewards for purchases
- Digital wallet with card and transaction history
- Rewards marketplace to redeem points
- Events and networking opportunities
- Profile and settings management

When a user asks a question:
1. Explain clearly what needs to be done
2. Provide simple step-by-step instructions in Hebrew
3. If possible, recommend relevant pages or actions inside the website

Navigation guide:
- Dashboard (ניהול ראשי): /dashboard - View your wallet balance, recent transactions, and quick actions
- Invoices (חשבוניות): /invoices - View and manage your invoices
- Upload Invoice: /invoices/upload - Upload a new invoice for verification
- Rewards (הטבות): /rewards - Browse and redeem rewards with your points
- Events (אירועים): /events - View and register for events
- Wallet (ארנק): /wallet - View your full wallet, transactions, and card details
- Profile (הפרופיל שלי): /profile - Edit your personal details
- Settings (הגדרות): /settings - Manage account settings

Always respond in Hebrew unless the user writes in English.
Be helpful, friendly, and concise.`;

// Google AI configuration - using latest available model
const GEMINI_MODEL = 'gemini-2.5-flash';

let genAI: GoogleGenerativeAI | null = null;
let isInitialized = false;
let initError: string | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      initError = 'GEMINI_API_KEY environment variable is not set';
      console.error('[AI Service] ' + initError);
      throw new Error(initError);
    }

    console.log('[AI Service] Initializing Google AI with Gemini');

    try {
      genAI = new GoogleGenerativeAI(apiKey);
      isInitialized = true;
      console.log('[AI Service] Google AI initialized successfully');
    } catch (error) {
      initError = error instanceof Error ? error.message : String(error);
      console.error('[AI Service] Failed to initialize Google AI:', initError);
      throw error;
    }
  }
  return genAI;
}

function getModel(): GenerativeModel {
  const ai = getGenAI();
  return ai.getGenerativeModel({ model: GEMINI_MODEL });
}

export const aiService = {
  // Check if AI service is available
  isAvailable(): boolean {
    return isInitialized && !initError;
  },

  async validateInvoice(imageUrl: string, declaredAmount: number) {
    try {
      const model = getModel();

      // Fetch image
      const response = await fetch(imageUrl);
      const arrayBuf = await response.arrayBuffer();
      const rawBuffer = Buffer.alloc(arrayBuf.byteLength);
      const view = new Uint8Array(arrayBuf);
      for (let i = 0; i < rawBuffer.length; i++) rawBuffer[i] = view[i];

      // Enhance image for better AI recognition
      let finalBuffer: any = rawBuffer;
      try {
        const { imageProcessorService } = await import('./image-processor.service.js');
        finalBuffer = await imageProcessorService.prepareForAI(rawBuffer);
        console.log('[AI] Using enhanced image for validation');
      } catch (enhanceError) {
        console.warn('[AI] Image enhancement skipped:', enhanceError);
      }

      const base64 = Buffer.from(finalBuffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';

      const prompt = `
        You are an invoice validation AI for a construction/architecture platform in Israel.
        Analyze this invoice image and extract:
        1. Total amount (look for "סה"כ", "total", "לתשלום", "סכום")
        2. Supplier/Company name
        3. Invoice date

        The user declared amount: ₪${declaredAmount}

        Respond ONLY in valid JSON format (no markdown):
        {
          "extractedAmount": number,
          "supplierName": "string",
          "date": "string",
          "confidence": number (0-1),
          "status": "MATCH" | "MISMATCH" | "UNCLEAR",
          "notes": "string in Hebrew"
        }

        Rules:
        - MATCH: if difference is less than 5%
        - MISMATCH: if difference is more than 5%
        - UNCLEAR: if you cannot read the amount clearly
      `;

      const result = await model.generateContent([
        { inlineData: { mimeType, data: base64 } },
        { text: prompt },
      ]);

      const text = result.response.text();
      const jsonText = text.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('AI validation error:', error);
      return {
        extractedAmount: 0,
        supplierName: '',
        date: '',
        confidence: 0,
        status: 'UNCLEAR',
        notes: 'לא ניתן לנתח את החשבונית',
      };
    }
  },

  async generateTrends(data: {
    invoices: any[];
    topSuppliers: any[];
    topArchitects: any[];
    period: string;
  }) {
    try {
      const model = getModel();

      const prompt = `
        You are a business intelligence AI for STANNEL - an architect-supplier loyalty platform in Israel.

        Analyze this data and provide actionable insights in Hebrew:

        Period: ${data.period}
        Total invoices: ${data.invoices.length}
        Total amount: ₪${data.invoices.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
        Top suppliers: ${JSON.stringify(data.topSuppliers)}
        Top architects: ${JSON.stringify(data.topArchitects)}

        Respond ONLY in valid JSON format (no markdown):
        {
          "summary": "2-3 sentence executive summary in Hebrew",
          "trends": [
            {"title": "string", "insight": "string in Hebrew", "action": "string in Hebrew"}
          ],
          "alerts": [
            {"severity": "HIGH" | "MEDIUM" | "LOW", "message": "string in Hebrew"}
          ],
          "recommendations": ["string in Hebrew"]
        }

        Focus on:
        - Growth patterns
        - Supplier engagement
        - Architect activity
        - Revenue opportunities
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonText = text.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('AI trends error:', error);
      return {
        summary: 'לא ניתן לייצר תובנות כרגע',
        trends: [],
        alerts: [],
        recommendations: [],
      };
    }
  },

  async chat(message: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    console.log('[AI Service] Chat request received, message length:', message.length);

    try {
      const model = getModel();

      // Start a chat with system instruction
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: AI_ASSISTANT_SYSTEM_PROMPT }],
          },
          {
            role: 'model',
            parts: [{ text: 'שלום! אני העוזר החכם של STANNEL. איך אוכל לעזור לך היום?' }],
          },
          // Add conversation history
          ...conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' as const : 'model' as const,
            parts: [{ text: msg.content }],
          })),
        ],
      });

      console.log('[AI Service] Sending request to Gemini...');
      const result = await chat.sendMessage(message);

      const text = result.response.text();
      console.log('[AI Service] Received response, length:', text.length);

      return text || 'מצטער, לא הצלחתי לעבד את הבקשה. אנא נסה שוב.';
    } catch (error) {
      // Log detailed error information
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error('[AI Service] Chat error:', {
        message: errorMessage,
        stack: errorStack,
        initError: initError,
      });

      // Return user-friendly error in Hebrew
      if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403')) {
        console.error('[AI Service] Permission denied - check API key');
        return 'מצטער, אין הרשאות לשירות ה-AI. אנא פנה למנהל המערכת.';
      }

      if (errorMessage.includes('API_KEY') || errorMessage.includes('invalid')) {
        console.error('[AI Service] Invalid API key');
        return 'מצטער, שירות ה-AI אינו מוגדר כראוי. אנא פנה למנהל המערכת.';
      }

      if (errorMessage.includes('QUOTA') || errorMessage.includes('429')) {
        return 'מצטער, הגעת למגבלת הבקשות. אנא נסה שוב בעוד מספר דקות.';
      }

      return 'מצטער, אירעה שגיאה. אנא נסה שוב מאוחר יותר.';
    }
  },
};
