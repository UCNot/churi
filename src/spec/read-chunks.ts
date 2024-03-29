import { Readable } from 'node:stream';
import { UcLexerStream } from '../syntax/uc-lexer-stream.js';
import { UcToken } from '../syntax/uc-token.js';

export function readChunks(...chunks: string[]): ReadableStream<string> {
  return Readable.toWeb(Readable.from(chunks)) as ReadableStream<string>;
}

export function readTokens(...tokens: UcToken[]): ReadableStream<UcToken> {
  return Readable.toWeb(Readable.from(tokens)) as ReadableStream<UcToken>;
}

export function parseTokens(...chunks: string[]): ReadableStream<UcToken> {
  return readChunks(...chunks).pipeThrough(new UcLexerStream());
}
