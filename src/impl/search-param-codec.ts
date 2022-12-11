import { escapeURIChargeTopLevelValue } from '../charge/impl/escape-uri-charge-string.js';

export function decodeSearchParam(encoded: string): string {
  return decodeURIComponent(encoded.replaceAll('+', ' '));
}

export function encodeSearchParam(decoded: string): string {
  return escapeURIChargeTopLevelValue(encodeURIComponent(decoded).replace(/%20/g, '+'));
}
