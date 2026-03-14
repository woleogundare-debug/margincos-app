import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Verify caller is superadmin
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_superadmin) return res.status(403).json({ error: 'Forbidden' });

  const { companyName, tier, adminName, adminEmail, tempPassword } = req.body;

  if (!companyName || !tier || !adminEmail || !tempPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert([{ name: companyName, tier, created_by: user.id }])
      .select()
      .single();
    if (teamError) throw teamError;

    // 2. Create user in Supabase Auth
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: adminName },
    });
    if (userError) throw userError;

    // 3. Create profile
    await supabase.from('profiles').upsert({
      id: newUser.user.id,
      email: adminEmail,
      full_name: adminName,
      tier,
      team_id: team.id,
      is_superadmin: false,
    });

    // 4. Add as team admin
    await supabase.from('team_members').insert([{
      team_id: team.id,
      user_id: newUser.user.id,
      role: 'admin',
    }]);

    // 5. Send welcome email
    await resend.emails.send({
      from: 'MarginCOS <info@carthenaadvisory.com>',
      to: adminEmail,
      subject: 'Welcome to MarginCOS — Your account is ready',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1B2A4A; padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 20px;">Welcome to MarginCOS</h2>
            <p style="color: #9CA3AF; margin: 4px 0 0; font-size: 14px;">Commercial Operating System</p>
          </div>
          <div style="background: #F9FAFB; padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="color: #1B2A4A; font-size: 15px;">Hi ${adminName},</p>
            <p style="color: #5A6B80; font-size: 15px; line-height: 1.6;">
              Your MarginCOS account for <strong>${companyName}</strong> is ready.
              You have been set up on the <strong>${tier}</strong> plan.
            </p>
            <div style="background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px; color: #6B7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your login details</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1B2A4A;"><strong>URL:</strong> https://margincos.com/login</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1B2A4A;"><strong>Email:</strong> ${adminEmail}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1B2A4A;"><strong>Temporary password:</strong> ${tempPassword}</p>
            </div>
            <p style="color: #5A6B80; font-size: 14px;">Please change your password on first login using the "Forgot password?" link.</p>
            <div style="margin: 24px 0;">
              <a href="https://margincos.com/login" style="background: #C0392B; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 600;">
                Sign In to MarginCOS →
              </a>
            </div>
            <p style="color: #5A6B80; font-size: 14px; line-height: 1.6;">
              Your Carthena Advisory team will be in touch to walk you through the platform.
              In the meantime, you can begin entering your portfolio data straight away.
            </p>
          </div>
          <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 16px;">
            MarginCOS · margincos.com · A product of Carthena Advisory
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      teamId: team.id,
      userId: newUser.user.id,
    });

  } catch (err) {
    console.error('Admin create-client error:', err);
    return res.status(500).json({ error: err.message });
  }
}
