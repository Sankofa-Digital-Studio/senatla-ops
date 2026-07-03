import { createClient } from '@supabase/supabase-js';

type UserInvitePayload = {
  email?: string;
  displayName?: string;
  role?: 'site' | 'office' | 'director';
};

type UserLifecyclePayload = {
  action?: 'activate' | 'suspend' | 'send_reset';
  userId?: string;
  redirectTo?: string;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const supabaseUrl = process.env.SENATLA_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: 'Supabase admin configuration is missing.' });
    return;
  }

  if (!token) {
    res.status(401).json({ error: 'Missing bearer token.' });
    return;
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: authUserData, error: authUserError } = await adminClient.auth.getUser(token);
  if (authUserError || !authUserData.user) {
    res.status(401).json({ error: 'Unable to verify admin session.' });
    return;
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role, display_name')
    .eq('id', authUserData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== 'office') {
    res.status(403).json({ error: 'Only office admins can manage users.' });
    return;
  }

  if (req.method === 'POST') {
    const payload = (req.body || {}) as UserInvitePayload;
    const email = `${payload.email || ''}`.trim().toLowerCase();
    const displayName = `${payload.displayName || ''}`.trim();
    const role = payload.role;

    if (!email || !displayName || (role !== 'site' && role !== 'office' && role !== 'director')) {
      res.status(400).json({ error: 'Email, display name, and role are required.' });
      return;
    }

    const { data: invitedUserData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);
    if (inviteError || !invitedUserData.user?.id) {
      res.status(400).json({ error: inviteError?.message || 'Unable to invite user.' });
      return;
    }

    const newProfile = {
      id: invitedUserData.user.id,
      username: email,
      display_name: displayName,
      role,
      is_active: true,
    };

    const { error: upsertError } = await adminClient.from('profiles').upsert(newProfile);
    if (upsertError) {
      res.status(400).json({ error: upsertError.message });
      return;
    }

    res.status(200).json({
      user: {
        id: newProfile.id,
        username: newProfile.username,
        displayName,
        role,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    });
    return;
  }

  const payload = (req.body || {}) as UserLifecyclePayload;
  const action = payload.action;
  const userId = `${payload.userId || ''}`.trim();
  const redirectTo = `${payload.redirectTo || ''}`.trim();

  if (!userId || (action !== 'activate' && action !== 'suspend' && action !== 'send_reset')) {
    res.status(400).json({ error: 'Lifecycle action and userId are required.' });
    return;
  }

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from('profiles')
    .select('id, username, display_name, role, is_active')
    .eq('id', userId)
    .maybeSingle();

  if (targetProfileError || !targetProfile) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }

  if (action === 'send_reset') {
    const email = `${targetProfile.username || ''}`.trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: 'Target user has no username/email.' });
      return;
    }

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: redirectTo ? { redirectTo } : undefined,
    });

    if (linkError) {
      res.status(400).json({ error: linkError.message });
      return;
    }

    res.status(200).json({
      ok: true,
      resetLink: linkData.properties?.action_link || null,
      message: `Password reset link generated for ${email}.`,
    });
    return;
  }

  const nextActive = action === 'activate';
  const { error: profileUpdateError } = await adminClient
    .from('profiles')
    .update({ is_active: nextActive })
    .eq('id', userId);

  if (profileUpdateError) {
    res.status(400).json({ error: profileUpdateError.message });
    return;
  }

  const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: nextActive ? 'none' : '876000h',
  });

  if (authUpdateError) {
    res.status(400).json({ error: authUpdateError.message });
    return;
  }

  res.status(200).json({
    ok: true,
    user: {
      id: targetProfile.id,
      username: targetProfile.username,
      displayName: targetProfile.display_name,
      role: targetProfile.role,
      isActive: nextActive,
    },
    message: nextActive ? 'User account reactivated.' : 'User account suspended.',
  });
}
