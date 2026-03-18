import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGmailClient, sendEmail } from '@/lib/services/gmail';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: Record<string, unknown> = await req.json();
  const to = typeof body.to === 'string' ? body.to : '';
  const subject = typeof body.subject === 'string' ? body.subject : '';
  const emailBody = typeof body.body === 'string' ? body.body : '';
  const companyName = typeof body.companyName === 'string' ? body.companyName : '';
  const contactName = typeof body.contactName === 'string' ? body.contactName : '';
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null;

  if (!to || !subject || !emailBody) {
    return Response.json({ error: 'to, subject, and body are required' }, { status: 400 });
  }

  try {
    const { gmail, fromEmail } = await getGmailClient(user.id);
    const messageId = await sendEmail(gmail, to, subject, emailBody, fromEmail);

    const { data: sentEmail } = await supabase
      .from('sent_emails')
      .insert({
        user_id: user.id,
        recipient_email: to,
        recipient_name: contactName,
        subject,
        body: emailBody,
        company_name: companyName,
        contact_name: contactName,
        status: 'sent',
        gmail_message_id: messageId,
        session_id: sessionId
      })
      .select('id')
      .single();

    // Track contacted company
    if (companyName && to) {
      await supabase.from('contacted_companies').upsert(
        {
          user_id: user.id,
          company_name: companyName,
          contact_email: to,
          contact_name: contactName,
          session_id: sessionId,
          sent_email_id: sentEmail?.id ?? null
        },
        { onConflict: 'user_id,company_name,contact_email' }
      );
    }

    return Response.json({ success: true, messageId });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to send email';

    await supabase.from('sent_emails').insert({
      user_id: user.id,
      recipient_email: to,
      recipient_name: contactName,
      subject,
      body: emailBody,
      company_name: companyName,
      contact_name: contactName,
      status: 'failed',
      error_message: errorMessage,
      session_id: sessionId
    });

    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
