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

Your task:
1. Fix missing word spacing (e.g., words merged without spaces like "5thandgame" -> "5th and game", "8thand 15th" -> "8th and 15th", "GameStarts" -> "Game Starts", "communicationor" -> "communication or"), spelling errors, grammatical mistakes, punctuation, and formatting in the provided text.
2. PRESERVE all HTML tags (<table>, <tr>, <td>, <th>, <p>, <br>, <strong>, <em>, <ul>, <li>, <div>, or styling attributes) and structure exactly. Only correct the inner human text. Do NOT strip or change table formatting.
3. List all specific issues and corrections you made so the user can review what was wrong and what was fixed.

Target Language Context: ${language === 'id' ? 'Bahasa Indonesia' : language === 'zh' ? 'Chinese' : 'English'}.

Return a valid JSON object with the following exact schema:
{
  "polishedContent": "The fully corrected HTML string with all tags preserved",
  "changes": [
    {
      "original": "exact word/phrase that had an issue or missing space",
      "fixed": "corrected word/phrase",
      "reason": "short explanation, e.g. 'Missing space between words' or 'Spelling fix'"
    }
  ],
  "summary": "Brief 1-sentence summary of the fixes found and made"
}

Text to polish:
${content}`;

    const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.7-flash'];
    let lastError: any = null;
    let parsedResult: { polishedContent: string; changes: any[]; summary: string } | null = null;

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
                responseMimeType: 'application/json',
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
          try {
            const parsed = JSON.parse(generatedText);
            if (parsed && parsed.polishedContent) {
              parsedResult = {
                polishedContent: parsed.polishedContent,
                changes: Array.isArray(parsed.changes) ? parsed.changes : [],
                summary: parsed.summary || 'Content polished successfully.',
              };
              break;
            }
          } catch (jsonErr) {
            // Fallback if raw text returned
            parsedResult = {
              polishedContent: generatedText,
              changes: [],
              summary: 'Content polished successfully.',
            };
            break;
          }
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }

    if (!parsedResult) {
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
      data: parsedResult,
    }, { status: 200 });

  } catch (error: any) {
    console.error('AI Polish error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error?.message || 'Internal server error while processing AI polish' },
      { status: 500 }
    );
  }
}
