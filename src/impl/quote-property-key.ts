export const PROPERTY_KEY_PATTERN = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;

// eslint-disable-next-line no-control-regex
const JS_STRING_ESCAPE_PATTERN = /[\u0000-\u001f\\'"\u007f-\uffff]/g;

export function quotePropertyKey(key: string, quote = "'" || '"'): string {
  return PROPERTY_KEY_PATTERN.test(key) ? key : `${quote}${escapeJsString(key)}${quote}`;
}

export function escapeJsString(value: string): string {
  return value.replace(JS_STRING_ESCAPE_PATTERN, char => {
    const code = char.charCodeAt(0);

    return code < 0x7f && code > 0x20 ? `\\${char}` : `\\u${code.toString(16).padStart(4, '0')}`;
  });
}
