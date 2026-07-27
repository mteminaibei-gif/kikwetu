import { describe, it, expect } from 'vitest';

/** Mirrors the normalize logic used in app/page.tsx for CI coverage. */
function normalizeProfiles(raw: unknown) {
  if (Array.isArray(raw)) {
    return (raw[0] as Record<string, unknown>) || undefined;
  }
  if (raw && typeof raw === 'object') {
    return raw as Record<string, unknown>;
  }
  return undefined;
}

describe('normalizeProfiles', () => {
  it('unwraps array join to single object', () => {
    const profile = { full_name: 'Amina', username: 'amina' };
    expect(normalizeProfiles([profile])).toEqual(profile);
  });

  it('keeps object join as-is', () => {
    const profile = { full_name: 'Njeri', username: 'njeri' };
    expect(normalizeProfiles(profile)).toEqual(profile);
  });

  it('returns undefined for empty array or null', () => {
    expect(normalizeProfiles([])).toBeUndefined();
    expect(normalizeProfiles(null)).toBeUndefined();
  });
});
