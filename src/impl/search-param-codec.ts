export function decodeSearchParam(encoded: string): string {
  return decodeURIComponent(encoded.replaceAll('+', ' '))
}

export function encodeSearchParam(decoded: string): string {
  return encodeURIComponent(decoded).replace(/%20/g, '+');
}
