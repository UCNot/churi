export function decodeSearchParam(encoded: string): string {
  return decodeURIComponent(encoded.replaceAll('+', ' '));
}

const SEARCH_PARAM_ENCODE_PATTERN = /(?:%20|[()])/g;
const SEARCH_PARAM_ENCODE_MAP: { readonly [char: string]: string } = {
  '%20': '+',
  '(': '%28',
  ')': '%29',
};

export function encodeSearchParam(decoded: string): string {
  return escapeSearchParamSpecials(encodeURIComponent(decoded)).replace(
    SEARCH_PARAM_ENCODE_PATTERN,
    char => SEARCH_PARAM_ENCODE_MAP[char],
  );
}

const SEARCH_PARAM_ESCAPE_MAP: { readonly [char: string]: string } = {
  '!': '%21',
  "'": '%27',
};

export function escapeSearchParamSpecials(encoded: string): string {
  if (encoded) {
    const escape = SEARCH_PARAM_ESCAPE_MAP[encoded[0]];

    if (escape) {
      return `${escape}${encoded.slice(1)}`;
    }
  }

  return encoded;
}
