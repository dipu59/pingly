import { NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    if (!adminMessaging) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized. Missing serviceAccountKey.json.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { tokens, title, body: notificationBody, data } = body;

    if (!tokens || !tokens.length) {
      return NextResponse.json({ error: 'No tokens provided' }, { status: 400 });
    }

    const message = {
      notification: {
        title,
        body: notificationBody,
      },
      data: data || {},
      tokens: tokens,
    };

    const response = await adminMessaging.sendEachForMulticast(message);
    
    return NextResponse.json({ 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount 
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
