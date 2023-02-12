import { Readable } from 'node:stream';

export function chunkStream(...chunks: string[]): ReadableStream<string> {
  return Readable.toWeb(Readable.from(chunks)) as ReadableStream<string>;
}
