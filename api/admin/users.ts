import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare const process: { env: Record<string, string | undefined> };

type AppRole = 'site' | 'office' | 'director';

type UserInvitePayload = {
  email?: string;
  displayName?: string;
};

type UserLifecyclePayload = {
  action?: 'activate' | 'suspend' | 'send_reset' | 'update_profile';
  userId?: string;
  redirectTo?: string;
  email?: string;
  displayName?: string;
};

type AdminProfile = {
  role: AppRole;
  is_active: boolean;
  organization_id: string;
  display_name: string;
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
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authUserData, error: authUserError } = await adminClient.auth.getUser(token);
  if (authUserError || !authUserData.user) {
    res.status(401).json({ error: 'Unable to verify admin session.' });
    return;
  }

  const actorId = authUserData.user.id;
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role, is_active, organization_id, display_name')
    .eq('id', actorId)
    .maybeSingle<AdminProfile>();

  if (profileError || profile?.role !== 'office' || !profile.is_active || !profile.organization_id) {
    res.status(403).json({ error: 'Only active office admins can manage users.' });
    return;
  }

  if (req.method === 'POST') {
    const payload = (req.body || {}) as UserInvitePayload;
    const email = normalizeEmail(payload.email);
    const displayName = `${payload.displayName || ''}`.trim();
    const role: AppRole = 'site';

    if (!email || !displayName) {
      res.status(400).json({ error: 'Email and display name are required.' });
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
      organization_id: profile.organization_id,
    };
    const { error: upsertError } = await adminClient.from('profiles').upsert(newProfile);
    if (upsertError) {
      res.status(400).json({ error: upsertError.message });
      return;
    }

    await recordAuthEvent(adminClient, profile, actorId, invitedUserData.user.id, 'user_invited', { role });
    res.status(200).json({
      user: {
        id: newProfile.id,
        username: email,
        displayName,
        role,
        isActive: true,
        createdAt: invitedUserData.user.created_at,
      },
    });
    return;
  }

  const payload = (req.body || {}) as UserLifecyclePayload;
  const action = payload.action;
  const userId = `${payload.userId || ''}`.trim();
  if (!userId || !action) {
    res.status(400).json({ error: 'Lifecycle action and userId are required.' });
    return;
  }

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from('profiles')
    .select('id, username, display_name, role, is_active, organization_id')
    .eq('id', userId)
    .eq('organization_id', profile.organization_id)
    .maybeSingle();

  if (targetProfileError || !targetProfile) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }

  if (action === 'send_reset') {
    const email = normalizeEmail(targetProfile.username);
    if (!email) {
      res.status(400).json({ error: 'Target user has no work email.' });
      return;
    }
    const redirectTo = `${payload.redirectTo || ''}`.trim();
    const { error } = await adminClient.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    await recordAuthEvent(adminClient, profile, actorId, userId, 'password_reset_requested', {});
    res.status(200).json({ ok: true, message: `Password reset email requested for ${email}.` });
    return;
  }

  if (action === 'update_profile') {
    const email = normalizeEmail(payload.email);
    const displayName = `${payload.displayName || ''}`.trim();
    const role = payload.role;
    if (!email || !displayName || !isAppRole(role)) {
      res.status(400).json({ error: 'Email, display name, and role are required.' });
      return;
    }

    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, { email });
    if (authUpdateError) {
      res.status(400).json({ error: authUpdateError.message });
      return;
    }
    const { error: profileUpdateError } = await adminClient
      .from('profiles')
      .update({ username: email, display_name: displayName, role })
      .eq('id', userId)
      .eq('organization_id', profile.organization_id);
    if (profileUpdateError) {
      res.status(400).json({ error: profileUpdateError.message });
      return;
    }

    if (targetProfile.role !== role) {
      await recordAuthEvent(adminClient, profile, actorId, userId, 'role_changed', { from: targetProfile.role, to: role });
    }
    res.status(200).json({
      ok: true,
      user: { id: userId, username: email, displayName, role, isActive: targetProfile.is_active },
    });
    return;
  }

  if (action !== 'activate' && action !== 'suspend') {
    res.status(400).json({ error: 'Unsupported lifecycle action.' });
    return;
  }
  if (action === 'suspend' && userId === actorId) {
    res.status(400).json({ error: 'Office administrators cannot suspend their own account.' });
    return;
  }

  const nextActive = action === 'activate';
  const { error: profileUpdateError } = await adminClient
    .from('profiles')
    .update({ is_active: nextActive })
    .eq('id', userId)
    .eq('organization_id', profile.organization_id);
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

  await recordAuthEvent(
    adminClient,
    profile,
    actorId,
    userId,
    nextActive ? 'account_activated' : 'account_deactivated',
    {},
  );
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

function normalizeEmail(value: unknown) {
  const email = `${value || ''}`.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function isAppRole(role: unknown): role is AppRole {
  return role === 'site' || role === 'office' || role === 'director';
}

async function recordAuthEvent(
  client: SupabaseClient,
  actor: AdminProfile,
  actorId: string,
  targetProfileId: string,
  eventType: string,
  details: Record<string, unknown>,
) {
  const { error } = await client.from('auth_activity_events').insert({
    organization_id: actor.organization_id,
    actor_id: actorId,
    target_profile_id: targetProfileId,
    event_type: eventType,
    details,
  });
  if (error) throw error;
}
