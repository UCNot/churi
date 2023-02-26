import { Readable } from 'node:stream';
import { UcToken } from '../syntax/uc-token.js';
import { UcTokenizerStream } from '../syntax/uc-tokenizer-stream.js';
import { UcTokenizer } from '../syntax/uc-tokenizer.js';

export function readChunks(...chunks: string[]): ReadableStream<string> {
  return Readable.toWeb(Readable.from(chunks)) as ReadableStream<string>;
}

export function readTokens(...chunks: string[]): ReadableStream<UcToken> {
  return readChunks(...chunks).pipeThrough(new UcTokenizerStream());
}

export function parseTokens(...chunks: string[]): readonly UcToken[] {
  const tokens: UcToken[] = [];
  const tokenizer = new UcTokenizer(token => {
    tokens.push(token);
  });

  for (const chunk of chunks) {
    tokenizer.split(chunk);
  }

  tokenizer.flush();

  return tokens;
}
