/**
 * Security & Input Sanitization Utilities
 */

export function sanitizeHtml(str) {
  if (typeof str !== 'string') return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;'
  };
  return str.replace(/[&<>"'/]/g, char => map[char]);
}

export function sanitizeText(str, maxLength = 1000) {
  if (!str) return '';
  const trimmed = String(str).trim().slice(0, maxLength);
  return sanitizeHtml(trimmed);
}

export function isValidRating(num) {
  const rating = Number(num);
  return !isNaN(rating) && rating >= 1 && rating <= 5;
}

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
