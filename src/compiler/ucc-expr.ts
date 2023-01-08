const UCC_ASCII_KEY_PATTERN = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
const UCC_STRING_ESCAPE_PATTERN = /['"\\]/g;

export function uccPropertyAccessExpr(host: string, key: string): string {
  return UCC_ASCII_KEY_PATTERN.test(key)
    ? `${host}.${key}`
    : `${host}['${uccStringExprContent(key)}']`;
}

export function uccStringExprContent(value: string): string {
  return value.replace(UCC_STRING_ESCAPE_PATTERN, char => `\\${char}`);
}
