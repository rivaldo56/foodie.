import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[AI Track] Interaction tracked:', body);
    
    return NextResponse.json({
      message: 'Interaction tracked successfully',
      learning_status: 'updated'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
