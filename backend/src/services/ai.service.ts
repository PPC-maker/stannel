// AI Service - Vertex AI (Gemini)

import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import { getConfig } from '../lib/config.js';

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

// Vertex AI configuration
// IMPORTANT: Gemini models are only available in specific regions
// Supported regions: us-central1, us-east4, us-west1, europe-west1, europe-west4, asia-northeast1, asia-southeast1
// me-west1 (Tel Aviv) does NOT support Gemini - we must use us-central1
const GEMINI_SUPPORTED_REGION = 'us-central1';
const GEMINI_MODEL = 'gemini-1.5-flash'; // Using flash for faster responses and lower cost

let vertexAI: VertexAI | null = null;
let isInitialized = false;
let initError: string | null = null;

function getVertexAI(): VertexAI {
  if (!vertexAI) {
    const config = getConfig();
    const projectId = config.GOOGLE_CLOUD_PROJECT || 'stannel-app';

    console.log(`[AI Service] Initializing Vertex AI - Project: ${projectId}, Region: ${GEMINI_SUPPORTED_REGION}`);

    try {
      vertexAI = new VertexAI({
        project: projectId,
        location: GEMINI_SUPPORTED_REGION
      });
      isInitialized = true;
      console.log('[AI Service] Vertex AI initialized successfully');
    } catch (error) {
      initError = error instanceof Error ? error.message : String(error);
      console.error('[AI Service] Failed to initialize Vertex AI:', initError);
      throw error;
    }
  }
  return vertexAI;
}

function getModel(): GenerativeModel {
  const vertex = getVertexAI();
  return vertex.getGenerativeModel({ model: GEMINI_MODEL });
}

export const aiService = {
  // Check if AI service is available
  isAvailable(): boolean {
    return isInitialized && !initError;
  },

  async validateInvoice(imageUrl: string, declaredAmount: number) {
    try {
      const model = getModel();

      // Fetch image and convert to base64
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
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

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
      });

      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

      // Build conversation contents
      const contents = [
        {
          role: 'user' as const,
          parts: [{ text: AI_ASSISTANT_SYSTEM_PROMPT }],
        },
        {
          role: 'model' as const,
          parts: [{ text: 'שלום! אני העוזר החכם של STANNEL. איך אוכל לעזור לך היום?' }],
        },
      ];

      // Add conversation history
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: msg.content }],
        });
      }

      // Add current message
      contents.push({
        role: 'user' as const,
        parts: [{ text: message }],
      });

      console.log('[AI Service] Sending request to Gemini...');
      const result = await model.generateContent({ contents });

      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
        console.error('[AI Service] Permission denied - check IAM roles for Vertex AI');
        return 'מצטער, אין הרשאות לשירות ה-AI. אנא פנה למנהל המערכת.';
      }

      if (errorMessage.includes('NOT_FOUND') || errorMessage.includes('404')) {
        console.error('[AI Service] Model or API not found - check if Vertex AI is enabled');
        return 'מצטער, שירות ה-AI אינו זמין כרגע. אנא נסה שוב מאוחר יותר.';
      }

      if (errorMessage.includes('QUOTA') || errorMessage.includes('429')) {
        return 'מצטער, הגעת למגבלת הבקשות. אנא נסה שוב בעוד מספר דקות.';
      }

      return 'מצטער, אירעה שגיאה. אנא נסה שוב מאוחר יותר.';
    }
  },
};
