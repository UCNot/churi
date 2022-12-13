import { UcValuePrefix } from './uc-value-decoder.js';

interface UcValueEscapeMap {
  readonly [special: string]: string;
}

type UcValueEscaped = UcValuePrefix | '(' | ')';
type UcKeyEscaped = '!' | "'" | '(' | ')';

const UC_VALUE_ESCAPE_MAP: UcValueEscapeMap = {
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
} satisfies { readonly [prefix in UcValueEscaped]: string };

const UC_KEY_ESCAPE_MAP: UcValueEscapeMap = {
  '!': UC_VALUE_ESCAPE_MAP['!'],
  "'": UC_VALUE_ESCAPE_MAP["'"],
  '(': UC_VALUE_ESCAPE_MAP['('],
  ')': UC_VALUE_ESCAPE_MAP[')'],
} satisfies { readonly [prefix in UcKeyEscaped]: string };

export function escapeUcValue(encoded: string): string {
  return escapeUcString(encoded, UC_VALUE_ESCAPE_MAP);
}

export function escapeUcKey(encoded: string): string {
  return escapeUcString(encoded, UC_KEY_ESCAPE_MAP);
}

export function escapeUcTopLevelValue(encoded: string): string {
  return escapeUcTopLevel(encoded, UC_VALUE_ESCAPE_MAP);
}

export function escapeUcTopLevelKey(encoded: string): string {
  return escapeUcTopLevel(encoded, UC_KEY_ESCAPE_MAP);
}

function escapeUcString(encoded: string, escapeMap: UcValueEscapeMap): string {
  return encoded && escapeMap[encoded[0]] ? `'${encoded}` : encoded;
}

function escapeUcTopLevel(encoded: string, escapeMap: UcValueEscapeMap): string {
  if (encoded) {
    const first = escapeMap[encoded[0]];

    if (first) {
      return first + encoded.slice(1);
    }
  }

  return encoded;
}
