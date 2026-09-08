/**
 * Google Meet and Online Classroom link utility functions
 */

export const DEFAULT_MEET_LINK = 'https://meet.google.com/new';

/**
 * Validates and normalizes meeting links.
 * Cleans up invalid Google Meet call names (e.g. 'https://meet.google.com/ai-...'
 * which Google Meet rejects with "Invalid video call name.")
 */
export function normalizeMeetingLink(link?: string | null, customFallback?: string): string {
  if (!link || typeof link !== 'string' || link.trim() === '') {
    return customFallback || DEFAULT_MEET_LINK;
  }

  const clean = link.trim();

  // If the link has the legacy broken format '/ai-...' or other non-existent nicknames that cause "Invalid video call name."
  if (
    clean.includes('/ai-') ||
    clean.includes('ai-ai-') ||
    clean.includes('test-zarntastic') ||
    clean.includes('ai-live-') ||
    clean.includes('ai-starter-') ||
    clean.includes('ai-corp-') ||
    clean.includes('ai-claude-') ||
    clean.includes('ai-lovable-')
  ) {
    return customFallback || DEFAULT_MEET_LINK;
  }

  // Ensure protocol
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    return `https://${clean}`;
  }

  return clean;
}

/**
 * Checks if the link is a Google Meet instant room generator
 */
export function isInstantMeetLink(link?: string | null): boolean {
  if (!link) return false;
  return link.includes('meet.google.com/new') || link.includes('meet.new');
}

/**
 * Checks if the Google Meet link matches standard 10-character code format: xxx-yyyy-zzz
 */
export function isValidMeetCodeFormat(link?: string | null): boolean {
  if (!link) return false;
  // Match standard meet.google.com/abc-defg-hij
  const regex = /meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i;
  return regex.test(link) || isInstantMeetLink(link);
}
