export function safeJsId(id: string): string {
  return id.replace(UNSAFE_ID_REPLACEMENT_PATTERN, replaceUnsafeJsChars);
}

const UNSAFE_ID_REPLACEMENT_PATTERN = /(?:^[^a-zA-Z_$]|(?<!^)[^0-9a-zA-Z_$])+/g;

function replaceUnsafeJsChars(chars: string): string {
  let result = '_';

  for (const char of chars) {
    result += 'x' + char.codePointAt(0)!.toString(16).toUpperCase();
  }

  return result + '_';
}
