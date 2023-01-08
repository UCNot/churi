const ASCII_KEY_PATTERN = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
const KEY_ESCAPE_PATTERN = /['\\]/g;

export function uccPropertyAccessExpr(host: string, key: string): string {
  return ASCII_KEY_PATTERN.test(key) ? `${host}.${key}` : `${host}['${uccStringExprContent(key)}']`;
}

export function uccStringExprContent(value: string): string {
  return value.replace(KEY_ESCAPE_PATTERN, char => `\\${char}`);
}
