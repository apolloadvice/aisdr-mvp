import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { serviceConfig } from '@/lib/services/config';
import { buildEmailGenerationPrompt } from '@/lib/prompts/email-generation';
import { createClient } from '@/lib/supabase/server';
import { emailGenerateBodySchema, parseBody } from '@/lib/validation';
import type { GeneratedEmailSequence } from '@/lib/types';

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not set' }, { status: 500 });
  }

  const parsed = parseBody(emailGenerateBodySchema, await req.json());
  if (!parsed.success) return parsed.response;

  const { company, contact, icp } = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    // Prefer user_profiles.full_name, fall back to OAuth metadata
    let fullName = '';
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();
      fullName =
        profile?.full_name ||
        (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '');
    }
    const senderFirstName = fullName.split(' ')[0] || undefined;

    const anthropic = new Anthropic();
    const prompt = buildEmailGenerationPrompt(company, contact, icp, senderFirstName);

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
