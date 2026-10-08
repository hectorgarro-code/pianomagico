export function normalizeGameProfile(profile, preferredAvatar) {
  if (!profile || profile.error || !profile.name) return null;
  const raw = Number(preferredAvatar ?? profile.avatarId ?? profile.avatar_id ?? 1);
  const avatarId = Number.isFinite(raw) && raw > 0 ? raw : 1;
  return { ...profile, avatarId, avatar_id: avatarId };
}
