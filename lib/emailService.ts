// This is a client-safe version that uses API routes
export async function sendEmail(
  to: string,
  templateName: string,
  data: any
) {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        templateName,
        data,
      }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
} 