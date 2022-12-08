import { ChURIValuePrefix } from '../charge/impl/ch-uri-value-decoder.js';

export function decodeSearchParam(encoded: string): string {
  return decodeURIComponent(encoded.replaceAll('+', ' '));
}

export function encodeSearchParam(decoded: string): string {
  return safeEncodeSearchParam(encodeURIComponent(decoded).replace(/%20/g, '+'));
}

const CHURI_VALUE_PREFIXES: {
  readonly [prefix: string]: string;
} = {
  '!': '%21',
  "'": '%27',
  '-': '%2D',
  0: '%30',
  1: '%31',
  2: '%32',
  3: '%33',
  4: '%34',
  5: '%35',
  6: '%36',
  7: '%37',
  8: '%38',
  9: '%39',
} satisfies { readonly [prefix in ChURIValuePrefix]: string };

function safeEncodeSearchParam(encoded: string): string {
  if (encoded) {
    const first = CHURI_VALUE_PREFIXES[encoded[0]];

    if (first) {
      return first + encoded.slice(1);
    }
  }

  return encoded;
}
