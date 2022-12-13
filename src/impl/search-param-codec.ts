import { escapeUcTopLevelValue } from '../charge/impl/uc-string-escapes.js';

export function decodeSearchParam(encoded: string): string {
  return decodeURIComponent(encoded.replaceAll('+', ' '));
}

export function encodeSearchParam(decoded: string): string {
  return escapeUcTopLevelValue(encodeURIComponent(decoded).replace(/%20/g, '+'));
}
