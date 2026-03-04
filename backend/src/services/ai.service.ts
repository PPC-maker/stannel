// AI Service - Vertex AI (Gemini)

import { VertexAI } from '@google-cloud/vertexai';

const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'stannel-project';
const location = process.env.VERTEX_LOCATION || 'us-central1';

let vertexAI: VertexAI | null = null;

function getVertexAI() {
  if (!vertexAI) {
    vertexAI = new VertexAI({ project: projectId, location });
  }
  return vertexAI;
}

export const aiService = {
  async validateInvoice(imageUrl: string, declaredAmount: number) {
    try {
      const vertex = getVertexAI();
      const model = vertex.getGenerativeModel({ model: 'gemini-1.5-pro' });

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
      const vertex = getVertexAI();
      const model = vertex.getGenerativeModel({ model: 'gemini-1.5-pro' });

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
};
