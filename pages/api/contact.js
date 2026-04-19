import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Honeypot check — bots fill this field, humans don't
  const { website, _loadedAt, turnstileToken, name, email, company, role, revenue, message } = req.body;

  if (website && website.length > 0) {
    // Silently return 200 so bots think submission succeeded
    return res.status(200).json({ success: true });
  }

  // Time-based check — real humans take at least 3 seconds to fill a form
  if (_loadedAt) {
    const elapsed = Date.now() - Number(_loadedAt);
    if (elapsed < 3000) {
      // Submitted in under 3 seconds — bot. Silent 200 same as honeypot.
      return res.status(200).json({ success: true });
    }
  }

  // Cloudflare Turnstile verification — layer 3 of the defence stack
  if (!turnstileToken) {
    return res.status(403).json({ error: 'Human verification required. Please complete the verification and try again.' });
  }

  try {
    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      }),
    });

    const turnstileResult = await turnstileResponse.json();

    if (!turnstileResult.success) {
      return res.status(403).json({ error: 'Human verification failed. Please refresh the page and try again.' });
    }
  } catch (err) {
    console.error('Turnstile verification error:', err);
    return res.status(500).json({ error: 'Verification service unavailable. Please try again shortly.' });
  }

  if (!name || !email || !company || !role) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  // Work email validation — reject free/consumer email providers
  const freeEmailDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'mail.com', 'protonmail.com', 'icloud.com', 'me.com', 'live.com',
    'msn.com', 'ymail.com', 'googlemail.com', 'yahoo.co.uk', 'hotmail.co.uk',
    'outlook.co.uk', 'yahoo.co.in', 'rediffmail.com', 'zoho.com',
    'gmx.com', 'gmx.net', 'mail.ru', 'yandex.com', 'tutanota.com',
    'fastmail.com', 'hushmail.com', 'inbox.com', 'att.net', 'comcast.net',
    'verizon.net', 'sbcglobal.net', 'cox.net', 'charter.net',
  ];

  const emailDomain = email?.split('@')[1]?.toLowerCase();
  if (!emailDomain || freeEmailDomains.includes(emailDomain)) {
    return res.status(400).json({ error: 'Please use your work email address.' });
  }

  // Save to Supabase
  const { error: dbError } = await supabase
    .from('contact_submissions')
    .insert([{ name, email, company, role, revenue, message, created_at: new Date().toISOString() }]);

  if (dbError) {
    console.error('Supabase error:', dbError);
    return res.status(500).json({ error: 'Submission failed' });
  }

  // Notification to Wole
  let resend;
  try {
    resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'MarginCOS <info@carthenaadvisory.com>',
      to: 'info@carthenaadvisory.com',
      subject: `New Diagnostic Request — ${company}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1B2A4A; padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 20px;">New Diagnostic Request</h2>
            <p style="color: #9CA3AF; margin: 4px 0 0; font-size: 14px;">Submitted via MarginCOS.com</p>
          </div>
          <div style="background: #F9FAFB; padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6B7280; font-size: 14px; width: 140px;">Name</td><td style="padding: 8px 0; color: #1B2A4A; font-size: 14px; font-weight: 600;">${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Work Email</td><td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${email}" style="color: #0D8F8F;">${email}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Company</td><td style="padding: 8px 0; color: #1B2A4A; font-size: 14px; font-weight: 600;">${company}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Role</td><td style="padding: 8px 0; color: #1B2A4A; font-size: 14px;">${role}</td></tr>
              <tr><td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Revenue</td><td style="padding: 8px 0; color: #1B2A4A; font-size: 14px;">${revenue || 'Not specified'}</td></tr>
              ${message ? `<tr><td style="padding: 8px 0; color: #6B7280; font-size: 14px; vertical-align: top;">Message</td><td style="padding: 8px 0; color: #1B2A4A; font-size: 14px;">${message}</td></tr>` : ''}
            </table>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
              <a href="mailto:${email}?subject=Re: MarginCOS Diagnostic Request" style="background: #C0392B; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">Reply to ${name} &rarr;</a>
            </div>
          </div>
          <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 16px;">MarginCOS &middot; Commercial Operating System &middot; margincos.com</p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error('Notification email error:', emailErr);
  }

  // Confirmation to submitter
  try {
    await resend.emails.send({
      from: 'MarginCOS <info@carthenaadvisory.com>',
      to: email,
      subject: 'Your diagnostic request has been received — MarginCOS',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1B2A4A; padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 20px;">Request Received</h2>
          </div>
          <div style="background: #F9FAFB; padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="color: #1B2A4A; font-size: 15px;">Hi ${name},</p>
            <p style="color: #5A6B80; font-size: 15px; line-height: 1.6;">Thank you for your interest in MarginCOS. We have received your diagnostic request for <strong>${company}</strong> and will be in touch within 24 hours to schedule your session.</p>
            <p style="color: #5A6B80; font-size: 15px; line-height: 1.6;">In your diagnostic session, we will apply MarginCOS directly to your commercial data and show you the first findings in the room.</p>
            <p style="color: #5A6B80; font-size: 15px;">Regards,<br/><strong style="color: #1B2A4A;">The Carthena Advisory Team</strong></p>
          </div>
          <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 16px;">MarginCOS &middot; margincos.com &middot; A product of Carthena Advisory</p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error('Confirmation email error:', emailErr);
  }

  return res.status(200).json({ success: true });
}
