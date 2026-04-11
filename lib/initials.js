/**
 * Generate initials for an avatar from a name or email.
 *
 * Priority order:
 * 1. If fullName has two or more words, use first letter of first word + first letter of last word
 * 2. If fullName has one word, use first two letters of that word
 * 3. If only email is available, use first two letters of the local part (before @)
 * 4. Fallback to "??" if neither is available
 *
 * Always returns 2 uppercase characters.
 */
export function getInitials(fullName, email) {
  const name = (fullName || '').trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }
  if (email) {
    const local = email.split('@')[0] || '';
    if (local.length >= 2) {
      return local.slice(0, 2).toUpperCase();
    }
    if (local.length === 1) {
      return (local + local).toUpperCase();
    }
  }
  return '??';
}
