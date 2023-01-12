const UCC_ASCII_KEY_PATTERN = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
// eslint-disable-next-line no-control-regex
const UCC_STRING_ESCAPE_PATTERN = /[\u0000-\u001f\\'"\u007f-\uffff]/g;

export function uccPropertyAccessExpr(host: string, key: string): string {
  return UCC_ASCII_KEY_PATTERN.test(key)
    ? `${host}.${key}`
    : `${host}['${uccStringExprContent(key)}']`;
}

export function uccStringExprContent(value: string): string {
  return value.replace(UCC_STRING_ESCAPE_PATTERN, char => {
    const code = char.charCodeAt(0);

    return code < 0x7f && code > 0x20 ? `\\${char}` : `\\u${code.toString(16).padStart(4, '0')}`;
  });
}
