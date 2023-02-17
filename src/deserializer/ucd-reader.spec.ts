import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { Readable } from 'node:stream';
import { chunkStream } from '../spec/chunk-stream.js';
import { UcdReader } from './ucd-reader.js';

describe('UcdReader', () => {
  let reader: UcdReader;

  afterEach(() => {
    reader.done();
  });

  describe('error', () => {
    it('throws by default', () => {
      reader = readChunks('abc', 'def');

      const error = new Error('Test!');

      expect(() => reader.error(error)).toThrow(error);
    });
    it('respects onError option', () => {
      let thrown: unknown;

      reader = new UcdReader(Readable.toWeb(Readable.from(['abc'])) as ReadableStream<string>, {
        onError: error => {
          thrown = error;
        },
      });

      const error = new Error('Test!');

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

      await expect(reader.next()).resolves.toBe('abc\r\n');
      await expect(reader.next()).resolves.toBe('def');
      expect(reader.current).toBe('def');
      expect(reader.prev).toEqual(['abc\r\n']);
    });
    it('handles Windows-style new lines splat across multiple chunks', async () => {
      reader = readChunks('abc\r', '', '\n', '', 'def');

      await expect(reader.next()).resolves.toBe('abc\r\n');
      await expect(reader.next()).resolves.toBe('def');
      expect(reader.current).toBe('def');
      expect(reader.prev).toEqual(['abc\r\n']);
    });
    it('handles Windows-style new lines splat across chunks after consumption', async () => {
      reader = readChunks('abc\r', '\ndef');

      await expect(reader.next()).resolves.toBe('abc\r\n');
      expect(reader.consume()).toBe('abc\r\n');

      await expect(reader.next()).resolves.toBe('def');
      expect(reader.current).toBe('def');
      expect(reader.prev).toHaveLength(0);
    });
  });

  describe('consume', () => {
    beforeEach(() => {
      reader = readChunks('abc\n', 'def\n');
    });

    it('consumes nothing by default', () => {
      expect(reader.consume()).toBe('');
    });
    it('consumes fully', async () => {
      await expect(reader.next()).resolves.toBe('abc\n');
      await expect(reader.next()).resolves.toBe('def\n');
      expect(reader.consume()).toBe('abc\ndef\n');
      expect(reader.current).toBeUndefined();
      expect(reader.prev).toHaveLength(0);

      expect(reader.consume()).toBe('');
    });
    it('consumes partially', async () => {
      await expect(reader.next()).resolves.toBe('abc\n');
      await expect(reader.next()).resolves.toBe('def\n');
      expect(reader.consume(2)).toBe('abc\nde');
      expect(reader.current).toBe('f\n');
      expect(reader.prev).toHaveLength(0);

      expect(reader.consume()).toBe('f\n');
      expect(reader.consume()).toBe('');
    });
  });

  describe('search', () => {
    beforeEach(() => {
      reader = readChunks('abc\n', 'def\n');
    });

    describe('one-line', () => {
      it('searches on the same line', async () => {
        await expect(reader.search('c')).resolves.toBe(2);
        expect(reader.current).toBe('abc\n');
        expect(reader.prev).toHaveLength(0);
      });
      it('does not searches across chunks', async () => {
        await expect(reader.search('e')).resolves.toBe(-1);
        expect(reader.current).toBe('abc\n');
        expect(reader.prev).toHaveLength(0);
      });
    });

    describe('multiline', () => {
      it('searches across chunks', async () => {
        await expect(reader.search('e', true)).resolves.toBe(1);
        expect(reader.current).toBe('def\n');
        expect(reader.prev).toEqual(['abc\n']);
      });
      it('iterates all chunks when not found', async () => {
        await expect(reader.search('Z', true)).resolves.toBe(-1);
        expect(reader.current).toBe('def\n');
        expect(reader.prev).toEqual(['abc\n']);
      });
    });
  });

  function readChunks(...chunks: string[]): UcdReader {
    return new UcdReader(chunkStream(...chunks));
  }
});
