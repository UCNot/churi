import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { Readable } from 'node:stream';
import { UcError } from '../schema/uc-error.js';
import { readTokens } from '../spec/read-chunks.js';
import { UC_TOKEN_CRLF, UC_TOKEN_LF } from '../syntax/uc-token.js';
import { UcdReader } from './ucd-reader.js';

describe('UcdReader', () => {
  let reader: UcdReader;

  afterEach(() => {
    reader.done();
  });

  describe('error', () => {
    it('throws by default', () => {
      reader = readChunks('abc', 'def');

      const error = new UcError({ code: 'test', message: 'Test!' });

      expect(() => reader.error(error)).toThrow(error);
    });
    it('respects onError option', () => {
      let thrown: unknown;

      reader = new UcdReader(Readable.toWeb(Readable.from(['abc'])) as ReadableStream<string>, {
        onError: error => {
          thrown = error;
        },
      });

      const error = new UcError({ code: 'test', message: 'Test!' });

      reader.error(error);

      expect(thrown).toBe(error);
    });
  });

  describe('next', () => {
    it('returns nothing after end of input', async () => {
      reader = readChunks('abc', 'def');

      await expect(reader.next()).resolves.toBe('abcdef');
      await expect(reader.next()).resolves.toBeUndefined();
      await expect(reader.next()).resolves.toBeUndefined();
    });
    it('ignores empty chunks', async () => {
      reader = readChunks('');

      await expect(reader.next()).resolves.toBeUndefined();
      await expect(reader.next()).resolves.toBeUndefined();
    });
    it('handles Windows-style new lines splat across chunks', async () => {
      reader = readChunks('abc\r', '\ndef');

      await expect(reader.next()).resolves.toBe('abc');
      await expect(reader.next()).resolves.toBe(UC_TOKEN_CRLF);
      await expect(reader.next()).resolves.toBe('def');
      expect(reader.current()).toBe('def');
      expect(reader.prev()).toEqual(['abc', UC_TOKEN_CRLF]);
    });
    it('handles Windows-style new lines splat across multiple chunks', async () => {
      reader = readChunks('abc\r', '', '\n', '', 'def');

      await expect(reader.next()).resolves.toBe('abc');
      await expect(reader.next()).resolves.toBe(UC_TOKEN_CRLF);
      await expect(reader.next()).resolves.toBe('def');
      expect(reader.current()).toBe('def');
      expect(reader.prev()).toEqual(['abc', UC_TOKEN_CRLF]);
    });
    it('handles Windows-style new lines splat across chunks after consumption', async () => {
      reader = readChunks('abc\r', '\ndef');

      await expect(reader.next()).resolves.toBe('abc');
      await expect(reader.next()).resolves.toBe(UC_TOKEN_CRLF);
      expect(reader.consume()).toEqual(['abc', UC_TOKEN_CRLF]);

      await expect(reader.next()).resolves.toBe('def');
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
    it('consumes fully', async () => {
      await expect(reader.next()).resolves.toBe('abc');
      await expect(reader.next()).resolves.toBe(UC_TOKEN_LF);
      await expect(reader.next()).resolves.toBe('def');
      await expect(reader.next()).resolves.toBe(UC_TOKEN_LF);
      expect(reader.consume()).toEqual(['abc', UC_TOKEN_LF, 'def', UC_TOKEN_LF]);
      expect(reader.current()).toBeUndefined();
      expect(reader.prev()).toHaveLength(0);

      expect(reader.consume()).toHaveLength(0);
    });
  });

  describe('consumePrev', () => {
    beforeEach(() => {
      reader = readChunks('abc\n', 'def\n');
    });

    it('consumes partially', async () => {
      await expect(reader.next()).resolves.toBe('abc');
      await expect(reader.next()).resolves.toBe(UC_TOKEN_LF);
      await expect(reader.next()).resolves.toBe('def');
      expect(reader.consumePrev()).toEqual(['abc', UC_TOKEN_LF]);
      expect(reader.consumePrev()).toHaveLength(0);
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

    it('searches for token', async () => {
      await expect(
        reader.find(token => (typeof token === 'string' && token.includes('e') ? true : null)),
      ).resolves.toBe('def');
      expect(reader.current()).toBe('def');
      expect(reader.prev()).toEqual(['abc', UC_TOKEN_LF]);
    });
    it('searches until negative result received', async () => {
      await expect(
        reader.find(token => typeof token === 'string' ? (token.includes('e') ? true : null) : false),
      ).resolves.toBeUndefined();
      expect(reader.current()).toBe(UC_TOKEN_LF);
      expect(reader.prev()).toEqual(['abc']);
    });
    it('iterates all tokens when not found', async () => {
      await expect(
        reader.find(token => (typeof token === 'string' && token.includes('Z') ? true : null)),
      ).resolves.toBeUndefined();
      expect(reader.current()).toBeUndefined();
      expect(reader.prev()).toEqual(['abc', UC_TOKEN_LF, 'def', UC_TOKEN_LF]);
    });
  });

  function readChunks(...chunks: string[]): UcdReader {
    return new UcdReader(readTokens(...chunks));
  }
});
