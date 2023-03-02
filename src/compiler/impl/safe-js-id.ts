export function safeJsId(id: string): string {
  return id.replace(UNSAFE_ID_REPLACEMENT_PATTERN, c => '_x' + c.charCodeAt(0).toString(16) + '_');
}

const UNSAFE_ID_REPLACEMENT_PATTERN = /(?:^[^a-zA-Z_$]|(?<!^)[^0-9a-zA-Z_$])/g;
