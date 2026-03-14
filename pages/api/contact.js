import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, role, revenue, message } = req.body;

  if (!name || !email || !company || !role) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  const { error } = await supabase
    .from('contact_submissions')
    .insert([{ name, email, company, role, revenue, message, created_at: new Date().toISOString() }]);

  if (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Submission failed' });
  }

  // TODO: send notification to info@carthenaadvisory.com

  return res.status(200).json({ success: true });
}
