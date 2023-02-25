import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { UcToken, UC_TOKEN_CRLF, UC_TOKEN_LF } from '../syntax/uc-token.js';
import { UcTokenizer } from '../syntax/uc-tokenizer.js';
import { SyncUcdReader } from './sync-ucd-reader.js';

describe('SyncUcdReader', () => {
  let reader: SyncUcdReader;

  afterEach(() => {
    reader.done();
  });

  describe('next', () => {
    it('returns nothing after end of input', () => {
      reader = readChunks('abc', 'def');

      expect(reader.hasNext()).toBe(true);
      expect(reader.next()).toBe('abcdef');
      expect(reader.hasNext()).toBe(false);
      expect(reader.next()).toBeUndefined();
      expect(reader.next()).toBeUndefined();
    });
    it('ignores empty chunks', () => {
      reader = readChunks('');

      expect(reader.hasNext()).toBe(false);
      expect(reader.next()).toBeUndefined();
      expect(reader.next()).toBeUndefined();
    });
    it('handles Windows-style new lines splat across chunks', () => {
      reader = readChunks('abc\r', '\ndef');

      expect(reader.next()).toBe('abc');
      expect(reader.next()).toBe(UC_TOKEN_CRLF);
      expect(reader.next()).toBe('def');
      expect(reader.current()).toBe('def');
      expect(reader.prev()).toEqual(['abc', UC_TOKEN_CRLF]);
    });
    it('handles Windows-style new lines splat across multiple chunks', () => {
      reader = readChunks('abc\r', '', '\n', '', 'def');

      expect(reader.next()).toBe('abc');
      expect(reader.next()).toBe(UC_TOKEN_CRLF);
      expect(reader.next()).toBe('def');
      expect(reader.current()).toBe('def');
      expect(reader.prev()).toEqual(['abc', UC_TOKEN_CRLF]);
    });
    it('handles Windows-style new lines splat across chunks after consumption', () => {
      reader = readChunks('abc\r', '\ndef');

      expect(reader.next()).toBe('abc');
      expect(reader.next()).toBe(UC_TOKEN_CRLF);
      expect(reader.consume()).toEqual(['abc', UC_TOKEN_CRLF]);

      expect(reader.next()).toBe('def');
      expect(reader.current()).toBe('def');
      expect(reader.prev()).toEqual([]);
    });
  });

  describe('consume', () => {
    beforeEach(() => {
      reader = readChunks('abc\n', 'def\n');
    });

    it('consumes nothing by default', () => {
      expect(reader.consume()).toHaveLength(0);
    });
    it('consumes fully', () => {
      expect(reader.next()).toBe('abc');
      expect(reader.next()).toBe(UC_TOKEN_LF);
      expect(reader.next()).toBe('def');
      expect(reader.next()).toBe(UC_TOKEN_LF);
      expect(reader.consume()).toEqual(['abc', UC_TOKEN_LF, 'def', UC_TOKEN_LF]);
      expect(reader.current()).toBeUndefined();
      expect(reader.prev()).toHaveLength(0);

      expect(reader.consume()).toHaveLength(0);
    });
  });

  describe('skip', () => {
    beforeEach(() => {
      reader = readChunks('abc\n', 'def\n');
    });

    it('skips nothing by default', () => {
      reader.skip();

      expect(reader.next()).toBe('abc');
    });
    it('skips everything', () => {
      expect(reader.next()).toBe('abc');
      expect(reader.next()).toBe(UC_TOKEN_LF);
      expect(reader.next()).toBe('def');
      expect(reader.next()).toBe(UC_TOKEN_LF);

      reader.skip();

      expect(reader.current()).toBeUndefined();
      expect(reader.prev()).toHaveLength(0);

      expect(reader.consume()).toHaveLength(0);
    });
  });

  describe('consumePrev', () => {
    beforeEach(() => {
      reader = readChunks('abc\n', 'def\n');
    });

    it('consumes partially', () => {
      expect(reader.next()).toBe('abc');
      expect(reader.next()).toBe(UC_TOKEN_LF);
      expect(reader.next()).toBe('def');
      expect(reader.consumePrev()).toEqual(['abc', UC_TOKEN_LF]);
      expect(reader.consumePrev()).toHaveLength(0);
      expect(reader.current()).toBe('def');
      expect(reader.prev()).toHaveLength(0);

      expect(reader.consume()).toEqual(['def']);
      expect(reader.consume()).toHaveLength(0);
    });
  });

  describe('omitPrev', () => {
    beforeEach(() => {
      reader = readChunks('abc\n', 'def\n');
    });

    it('omits partially', () => {
      expect(reader.next()).toBe('abc');
      expect(reader.next()).toBe(UC_TOKEN_LF);
      expect(reader.next()).toBe('def');

      reader.omitPrev();

      expect(reader.current()).toBe('def');
      expect(reader.prev()).toHaveLength(0);

      expect(reader.consume()).toEqual(['def']);
      expect(reader.consume()).toHaveLength(0);
    });
  });

  describe('find', () => {
    beforeEach(() => {
      reader = readChunks('abc\n', 'def\n');
    });

    it('searches for token', () => {
      expect(
        reader.find(token => (typeof token === 'string' && token.includes('e') ? true : null)),
      ).toBe('def');
      expect(reader.current()).toBe('def');
      expect(reader.prev()).toEqual(['abc', UC_TOKEN_LF]);
    });
    it('searches until negative result received', () => {
      expect(
        reader.find(token => typeof token === 'string' ? (token.includes('e') ? true : null) : false),
      ).toBeUndefined();
      expect(reader.current()).toBe(UC_TOKEN_LF);
      expect(reader.prev()).toEqual(['abc']);
    });
    it('iterates all tokens when not found', () => {
      expect(
        reader.find(token => (typeof token === 'string' && token.includes('Z') ? true : null)),
      ).toBeUndefined();
      expect(reader.current()).toBeUndefined();
      expect(reader.prev()).toEqual(['abc', UC_TOKEN_LF, 'def', UC_TOKEN_LF]);
    });
  });

  function readChunks(...chunks: string[]): SyncUcdReader {
    const tokens: UcToken[] = [];
    const tokenizer = new UcTokenizer(token => {
      tokens.push(token);
    });

    for (const chunk of chunks) {
      tokenizer.split(chunk);
    }

    tokenizer.flush();

    return new SyncUcdReader(tokens);
  }
});
