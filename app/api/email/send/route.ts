import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService.server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Email API request body:', body);
    
    const { to, templateName, data } = body;
    
    // Validate required fields with more specific error messages
    if (!to) {
      console.error('Missing required field: to');
      return NextResponse.json({ error: 'Missing required field: to' }, { status: 400 });
    }
    
    if (!templateName) {
      console.error('Missing required field: templateName');
      return NextResponse.json({ error: 'Missing required field: templateName' }, { status: 400 });
    }
    
    if (!data) {
      console.error('Missing required field: data');
      return NextResponse.json({ error: 'Missing required field: data' }, { status: 400 });
    }
    
    // Check if template exists
    const validTemplates = [
      'orderConfirmation', 
      'shippingConfirmation', 
      'orderDelivered', 
      'orderCanceled', 
      'refundProcessed', 
      'transferOrder',
      'orderProcessing'
    ];
    
    if (!validTemplates.includes(templateName)) {
      console.error(`Unknown template: ${templateName}`);
      return NextResponse.json({ 
        error: `Unknown template: ${templateName}`,
        validTemplates 
      }, { status: 400 });
    }
    
    // Send the email
    const result = await sendEmail(to, templateName, data);
    
    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    } else {
      console.error('Email sending failed:', result.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
} 