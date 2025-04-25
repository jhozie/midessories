import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService.server';

export async function GET() {
  try {
    const result = await sendEmail(
      'josephcgs02@gmail.com',
      'welcomeEmail',
      {
        firstName: 'Test User',
        shopUrl: process.env.NEXT_PUBLIC_SITE_URL + '/shop'
      }
    );
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
  }
} 