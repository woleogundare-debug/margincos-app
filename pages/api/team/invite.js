import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { TIER_LIMITS } from '../../../lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, role, teamId, teamName, inviterName } = req.body;

  // ── Seat cap enforcement ────────────────────────────────────
  // Look up the team owner's tier, then count members + pending invites
  const { data: ownerMember } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', teamId)
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (ownerMember) {
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('user_id', ownerMember.user_id)
      .single();

    const tier = ownerProfile?.tier || 'essentials';
    const cap  = TIER_LIMITS[tier]?.maxMembers;

    if (cap !== null && cap !== undefined) {
      const { count: memberCount } = await supabase
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId);

      const { count: pendingCount } = await supabase
        .from('team_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('status', 'pending');

      if ((memberCount || 0) + (pendingCount || 0) >= cap) {
        return res.status(403).json({
          error: `Seat limit reached (${cap} on ${tier} plan). Upgrade to add more members.`,
        });
      }
    }
  }
  // ── End seat cap enforcement ────────────────────────────────

  const { data: invite, error } = await supabase
    .from('team_invitations')
    .select('token')
    .eq('team_id', teamId)
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !invite) return res.status(500).json({ error: 'Invitation not found' });

  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/join?token=${invite.token}`;

  try {
    await resend.emails.send({
      from: 'MarginCOS <info@carthenaadvisory.com>',
      to: email,
      subject: `${inviterName} has invited you to join ${teamName} on MarginCOS`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1B2A4A; padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 20px;">You've been invited</h2>
            <p style="color: #9CA3AF; margin: 4px 0 0; font-size: 14px;">MarginCOS &middot; Commercial Operating System</p>
          </div>
          <div style="background: #F9FAFB; padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="color: #1B2A4A; font-size: 15px; line-height: 1.6;">
              <strong>${inviterName}</strong> has invited you to join <strong>${teamName}</strong> on MarginCOS as a ${role}.
            </p>
            <p style="color: #5A6B80; font-size: 15px; line-height: 1.6;">
              Click the button below to accept your invitation and set up your account. This link expires in 7 days.
            </p>
            <div style="margin: 32px 0;">
              <a href="${inviteUrl}" style="background: #C0392B; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 600;">
                Accept Invitation &rarr;
              </a>
            </div>
            <p style="color: #9CA3AF; font-size: 13px;">If you weren't expecting this invitation, you can safely ignore this email.</p>
          </div>
          <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 16px;">MarginCOS &middot; margincos.com &middot; A product of Carthena Advisory</p>
        </div>
      `,
    });
  } catch (emailErr) {
    // Email send failed, but the invitation row exists in DB and the token is valid.
    // Return 200 with emailSent flag + inviteLink so the UI can surface the
    // partial-success state and the inviter can share the link manually.
    console.error('Team invite email error:', {
      teamId,
      email,
      error: emailErr?.message || emailErr,
    });
    return res.status(200).json({
      success: true,
      emailSent: false,
      inviteLink: inviteUrl,
      message: 'Invitation created but email delivery failed. Share the link manually.',
    });
  }

  return res.status(200).json({ success: true, emailSent: true });
}
