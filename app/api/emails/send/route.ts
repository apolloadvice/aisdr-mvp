import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGmailClient, sendEmail } from '@/lib/services/gmail';
import { emailSendBodySchema, parseBody } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = parseBody(emailSendBodySchema, await req.json());
  if (!parsed.success) return parsed.response;

  const { to, subject, body: emailBody, companyName, contactName, sessionId } = parsed.data;

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
        session_id: sessionId ?? null
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
          session_id: sessionId ?? null,
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
      session_id: sessionId ?? null
    });

    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
