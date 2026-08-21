import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse } from '@/types';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (!session.permissions.canUpload && !session.permissions.canReplace)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { content, language = 'en', field = 'description' } = await request.json();

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'No content provided to polish' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json<ApiResponse>(
        { 
          success: false, 
          error: 'GEMINI_API_KEY is not configured in the server environment (.env). Please add GEMINI_API_KEY.' 
        }, 
        { status: 500 }
      );
    }

    const prompt = `You are a professional multilingual editor and proofreader for an international luxury resort & casino event management system.

Your task is to fix spelling errors, grammatical mistakes, missing word spacing (e.g., words merged without spaces like "5thandgame" -> "5th and game", "8thand 15th" -> "8th and 15th", "GameStarts" -> "Game Starts"), punctuation, and formatting in the provided text.

Target Language Context: ${language === 'id' ? 'Bahasa Indonesia' : language === 'zh' ? 'Chinese (Simplified/Traditional)' : 'English'}.

CRITICAL REQUIREMENTS:
1. If the input contains HTML tags (such as <table>, <tr>, <td>, <th>, <p>, <br>, <strong>, <em>, <ul>, <li>, <div>, or styling attributes), you MUST PRESERVE all HTML tags, table structures, and attributes EXACTLY as they are. Do NOT remove, rename, or strip any HTML tags.
2. Only correct and refine the readable human text content inside the tags.
3. Fix all missing spaces between numbers, words, conjunctions, and prepositions (e.g., "5thround" -> "5th round", "15hands" -> "15 hands").
4. Return ONLY the polished text/HTML directly. Do NOT wrap your output in markdown code blocks (\`\`\`html or \`\`\`), and do not include any conversational preamble or notes.

Text to polish:
${content}`;

    const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.7-flash'];
    let lastError: any = null;
    let polishedResult: string | null = null;

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8192,
              },
            }),
          }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          lastError = errData?.error?.message || `HTTP ${response.status} from Gemini API`;
          continue;
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const generatedText = candidate?.content?.parts?.[0]?.text;

        if (generatedText && typeof generatedText === 'string') {
          // Clean any markdown backticks if Gemini wrapped it
          let cleaned = generatedText.trim();
          if (cleaned.startsWith('```html')) {
            cleaned = cleaned.replace(/^```html\s*/i, '').replace(/```$/i, '').trim();
          } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\w*\s*/, '').replace(/```$/, '').trim();
          }
          polishedResult = cleaned;
          break;
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }

    if (!polishedResult) {
      return NextResponse.json<ApiResponse>(
        { 
          success: false, 
          error: `Failed to generate with Gemini API: ${lastError || 'Unknown error'}` 
        }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        polishedContent: polishedResult,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('AI Polish error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error?.message || 'Internal server error while processing AI polish' },
      { status: 500 }
    );
  }
}
