import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Please provide a valid prompt description.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY environment variable is missing.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemInstruction = `You are a Senior Software Solutions Architect & Engineering Project Estimator.
Analyze the user's software project idea or requirements prompt.
Return a structured JSON object recommending the appropriate technical parameters, platforms, features, team headcount composition, risk assessment, and architectural recommendations.

Your output JSON MUST strictly conform to this schema:
{
  "projectName": "string (short clear title)",
  "executiveSummary": "string (2-3 sentences overview of scope, technical complexity, and architectural approach)",
  "complexity": "mvp" | "standard" | "enterprise",
  "designLevel": "wireframe" | "standard_ui" | "custom_bespoke",
  "qaLevel": "basic" | "standard" | "automated_security",
  "platforms": Array<"web" | "ios" | "android" | "cross_platform" | "desktop">,
  "recommendedFeatureIds": Array<string of IDs from: ["auth_basic", "auth_sso", "auth_mfa", "auth_rbac", "pay_stripe", "pay_usage", "pay_marketplace", "ai_llm_chat", "ai_rag_vectors", "ai_vision_ocr", "chat_realtime", "notifications_push", "cms_admin", "media_upload", "analytics_charts", "search_elastic", "integration_thirdparty", "integration_webhooks", "sec_compliance"]>,
  "targetTimelineWeeks": number,
  "keyArchitecturalRisks": Array<string (3-4 bullet points)>,
  "costOptimizationTips": Array<string (2-3 bullet points for saving budget)>
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Please estimate and structure the software development scope for this project idea:
"${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectName: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            complexity: { type: Type.STRING },
            designLevel: { type: Type.STRING },
            qaLevel: { type: Type.STRING },
            platforms: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendedFeatureIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            targetTimelineWeeks: { type: Type.NUMBER },
            keyArchitecturalRisks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            costOptimizationTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            'projectName',
            'executiveSummary',
            'complexity',
            'designLevel',
            'qaLevel',
            'platforms',
            'recommendedFeatureIds',
            'targetTimelineWeeks',
            'keyArchitecturalRisks',
            'costOptimizationTips'
          ]
        }
      }
    });

    const jsonText = response.text?.trim() || '{}';
    const parsedData = JSON.parse(jsonText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('AI Estimator Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI project estimation.' },
      { status: 500 }
    );
  }
}
