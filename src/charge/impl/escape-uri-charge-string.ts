import { ChURIValuePrefix } from './ch-uri-value-decoder.js';

interface URIChargeEscapeMap {
  readonly [special: string]: string;
}

type URIChargeValueEscaped = ChURIValuePrefix | '(' | ')';
type URIChargeKeyEscaped = '!' | "'" | '(' | ')';

const URI_CHARGE_VALUE_ESCAPE_MAP: URIChargeEscapeMap = {
  '!': '%21',
  "'": '%27',
  '(': '%28',
  ')': '%29',
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
} satisfies { readonly [prefix in URIChargeValueEscaped]: string };

const URI_CHARGE_KEY_ESCAPE_MAP: URIChargeEscapeMap = {
  '!': URI_CHARGE_VALUE_ESCAPE_MAP['!'],
  "'": URI_CHARGE_VALUE_ESCAPE_MAP["'"],
  '(': URI_CHARGE_VALUE_ESCAPE_MAP['('],
  ')': URI_CHARGE_VALUE_ESCAPE_MAP[')'],
} satisfies { readonly [prefix in URIChargeKeyEscaped]: string };

export function escapeURIChargeValue(encoded: string): string {
  return escapeURIChargeString(encoded, URI_CHARGE_VALUE_ESCAPE_MAP);
}

export function escapeURIChargeKey(encoded: string): string {
  return escapeURIChargeString(encoded, URI_CHARGE_KEY_ESCAPE_MAP);
}

export function escapeURIChargeTopLevelValue(encoded: string): string {
  return escapeURIChargeTopLevel(encoded, URI_CHARGE_VALUE_ESCAPE_MAP);
}

export function escapeURIChargeTopLevelKey(encoded: string): string {
  return escapeURIChargeTopLevel(encoded, URI_CHARGE_KEY_ESCAPE_MAP);
}

function escapeURIChargeString(encoded: string, escapeMap: URIChargeEscapeMap): string {
  return encoded && escapeMap[encoded[0]] ? `'${encoded}` : encoded;
}

function escapeURIChargeTopLevel(encoded: string, escapeMap: URIChargeEscapeMap): string {
  if (encoded) {
    const first = escapeMap[encoded[0]];

    if (first) {
      return first + encoded.slice(1);
    }
  }

  return encoded;
}
