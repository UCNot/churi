import { Readable } from 'node:stream';
import { UcLexer } from '../syntax/lexers/uc.lexer.js';
import { UcLexerStream } from '../syntax/uc-lexer-stream.js';
import { UcToken } from '../syntax/uc-token.js';

export function readChunks(...chunks: string[]): ReadableStream<string> {
  return Readable.toWeb(Readable.from(chunks)) as ReadableStream<string>;
}

export function readTokens(...chunks: string[]): ReadableStream<UcToken> {
  return readChunks(...chunks).pipeThrough(new UcLexerStream());
}

export function parseTokens(...chunks: string[]): readonly UcToken[] {
  const tokens: UcToken[] = [];
  const tokenizer = new UcLexer(token => {
    tokens.push(token);
  });

  for (const chunk of chunks) {
    tokenizer.scan(chunk);
  }

  tokenizer.flush();

  return tokens;
}
