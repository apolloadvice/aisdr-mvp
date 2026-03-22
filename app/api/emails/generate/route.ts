import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { serviceConfig } from '@/lib/services/config';
import { buildEmailGenerationPrompt } from '@/lib/prompts/email-generation';
import { getAuthUser } from '@/lib/supabase/server';
import { emailGenerateBodySchema, parseBody } from '@/lib/validation';
import type { GeneratedEmailSequence } from '@/lib/types';
import { getProfile } from '@/lib/supabase/queries';

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not set' }, { status: 500 });
  }

  const parsed = parseBody(emailGenerateBodySchema, await req.json());
  if (!parsed.success) return parsed.response;

  const { company, contact, icp } = parsed.data;

  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await getProfile(supabase, user.id);
    const fullName =
      profile?.full_name ||
      (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '');
    const senderFirstName = fullName.split(' ')[0] || undefined;
    const senderCompany = profile?.company_name || undefined;

    const anthropic = new Anthropic();
    const prompt = buildEmailGenerationPrompt(
      company,
      contact,
      icp,
      senderFirstName,
      senderCompany
    );

    const message = await anthropic.messages.create({
      model: serviceConfig.emailModel,
      max_tokens: serviceConfig.emailMaxTokens,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: 'Failed to parse email response' }, { status: 500 });
    }

    const sequence: GeneratedEmailSequence = JSON.parse(jsonMatch[0]);

    if (!sequence.emails || sequence.emails.length !== 3) {
      return Response.json({ error: 'Invalid email sequence format' }, { status: 500 });
    }

    return Response.json(sequence);
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : 'Failed to generate email';
    return Response.json({ error: errMessage }, { status: 500 });
  }
}
