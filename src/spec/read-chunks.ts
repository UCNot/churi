import { Readable } from 'node:stream';
import { UcToken } from '../syntax/uc-token.js';
import { UcTokenizerStream } from '../syntax/uc-tokenizer-stream.js';

export function readChunks(...chunks: string[]): ReadableStream<string> {
  return Readable.toWeb(Readable.from(chunks)) as ReadableStream<string>;
}

export function readTokens(...chunks: string[]): ReadableStream<UcToken> {
  return readChunks(...chunks).pipeThrough(new UcTokenizerStream());
}
