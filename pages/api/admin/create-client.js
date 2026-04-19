import { requireAuth, createSupabaseServiceClient } from '../../../lib/supabase/server';
import { ALLOWED_SECTORS } from '../../../lib/sectorConfig';
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Verify caller identity via cookie-based session
  const auth = await requireAuth(req, res);
  console.log('DIAG: auth user:', JSON.stringify({ id: auth?.user?.id, email: auth?.user?.email }));
  if (auth.redirect) return res.status(401).json({ error: 'Unauthorized' });

  // All admin operations use the service role client
  const serviceClient = createSupabaseServiceClient();

  // Verify superadmin status from DB — not from client-supplied values
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('is_superadmin')
    .eq('user_id', auth.user.id)
    .single();
  if (!profile?.is_superadmin) {
    return res.status(403).json({
      error: 'Forbidden',
      _diag: {
        userId: auth?.user?.id,
        userEmail: auth?.user?.email,
        profileFound: !!profile,
        profileUserId: profile?.user_id,
        isSuperadmin: profile?.is_superadmin,
        profileError: profileError ? { message: profileError.message, code: profileError.code, details: profileError.details, hint: profileError.hint } : null,
      }
    });
  }

  const { companyName, tier, sector, adminName, adminEmail, tempPassword } = req.body;

  if (!companyName || !tier || !sector || !adminEmail || !tempPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!ALLOWED_SECTORS.includes(sector)) {
    return res.status(400).json({ error: `Invalid sector. Must be one of: ${ALLOWED_SECTORS.join(', ')}` });
  }

  let team, newUser;

  try {
    // 1. Create team
    const { data: teamData, error: teamError } = await serviceClient
      .from('teams')
      .insert([{ name: companyName, tier, sector, created_by: auth.user.id }])
      .select()
      .single();
    if (teamError) throw teamError;
    team = teamData;

    // 2. Create user in Supabase Auth
    const { data: userData, error: userError } = await serviceClient.auth.admin.createUser({
      email: adminEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: adminName, must_change_password: true },
    });
    if (userError) throw userError;
    newUser = userData;

    // 3. Create profile
    await serviceClient.from('profiles').upsert({
      user_id: newUser.user.id,
      email: adminEmail,
      full_name: adminName,
      tier,
      team_id: team.id,
      is_superadmin: false,
    });

    // 4. Add as team admin
    await serviceClient.from('team_members').insert([{
      team_id: team.id,
      user_id: newUser.user.id,
      role: 'admin',
    }]);

    // 4b. Create default division named after the company
    const { data: defaultDivision, error: divisionError } = await serviceClient
      .from('divisions')
      .insert({ team_id: team.id, name: companyName, is_default: true, sector })
      .select('id')
      .single();

    if (divisionError) {
      console.error('Admin create-client — division creation error (non-fatal):', divisionError.message);
      // Non-fatal: client can still use the platform; migration may not yet be run
    }

    // 4c. Link profile to the default division
    if (defaultDivision?.id) {
      await serviceClient
        .from('profiles')
        .update({ division_id: defaultDivision.id })
        .eq('user_id', newUser.user.id);
    }

    // DB cascade complete - team, user, profile, membership, division all created.
    // Welcome email is isolated below so a Resend failure cannot roll back the above.

  } catch (err) {
    console.error('Admin create-client error:', err);
    return res.status(500).json({ error: err.message });
  }

  // 5. Send welcome email (outside DB try/catch)
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
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
            <p style="color: #5A6B80; font-size: 14px;">You'll be prompted to set a permanent password when you first sign in.</p>
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
      emailSent: true,
    });
  } catch (emailErr) {
    console.error('Admin create-client welcome email error:', {
      adminEmail,
      error: emailErr?.message || emailErr,
    });
    return res.status(200).json({
      success: true,
      teamId: team.id,
      userId: newUser.user.id,
      emailSent: false,
      manualActionRequired: `Welcome email failed to send. Log in to Resend to check status, or send credentials manually to ${adminEmail}.`,
    });
  }
}
