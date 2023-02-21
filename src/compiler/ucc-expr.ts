import { escapeJsString, PROPERTY_KEY_PATTERN } from '../impl/quote-property-key.js';

export function uccPropertyAccessExpr(host: string, key: string): string {
  return PROPERTY_KEY_PATTERN.test(key) ? `${host}.${key}` : `${host}['${escapeJsString(key)}']`;
}
