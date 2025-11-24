import { NextResponse } from 'next/server';

interface ChatRequestBody {
  message?: string;
}

export async function POST(request: Request) {
  try {
    const body: ChatRequestBody = await request.json().catch(() => ({}));
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const reply = `Gemini mock response: ${message}`;

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[Foodie] /api/chat error', error);
    return NextResponse.json({ error: 'Failed to generate reply.' }, { status: 500 });
  }
}
