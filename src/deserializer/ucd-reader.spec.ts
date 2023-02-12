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

      await expect(reader.next()).resolves.toBe('abc');
      await expect(reader.next()).resolves.toBe('def');
      await expect(reader.next()).resolves.toBeUndefined();
      await expect(reader.next()).resolves.toBeUndefined();
    });
    it('handles Windows-style new lines splat across chunks', async () => {
      reader = readChunks('abc\r', '\ndef');

      await expect(reader.next()).resolves.toBe('abc\r');
      await expect(reader.next()).resolves.toBe('def');
      expect(reader.current).toBe('def');
      expect(reader.prev).toEqual(['abc\r\n']);
    });
    it('handles Windows-style new lines splat across multiple chunks', async () => {
      reader = readChunks('abc\r', '', '\n', '', 'def');

      await expect(reader.next()).resolves.toBe('abc\r');
      await expect(reader.next()).resolves.toBe('def');
      expect(reader.current).toBe('def');
      expect(reader.prev).toEqual(['abc\r\n']);
    });
    it('handles Windows-style new lines splat across chunks after consumption', async () => {
      reader = readChunks('abc\r', '\ndef');

      await expect(reader.next()).resolves.toBe('abc\r');
      expect(reader.consume()).toBe('abc\r');

      await expect(reader.next()).resolves.toBe('def');
      expect(reader.current).toBe('def');
      expect(reader.prev).toEqual(['\n']);
    });
  });

  describe('consume', () => {
    beforeEach(() => {
      reader = readChunks('abc', 'def');
    });

    it('consumes nothing by default', () => {
      expect(reader.consume()).toBe('');
    });
    it('consumes fully', async () => {
      await expect(reader.next()).resolves.toBe('abc');
      await expect(reader.next()).resolves.toBe('def');
      expect(reader.consume()).toBe('abcdef');
      expect(reader.current).toBeUndefined();
      expect(reader.prev).toHaveLength(0);

      expect(reader.consume()).toBe('');
    });
    it('consumes partially', async () => {
      await expect(reader.next()).resolves.toBe('abc');
      await expect(reader.next()).resolves.toBe('def');
      expect(reader.consume(2)).toBe('abcde');
      expect(reader.current).toBe('f');
      expect(reader.prev).toHaveLength(0);

      expect(reader.consume()).toBe('f');
      expect(reader.consume()).toBe('');
    });
  });

  describe('search', () => {
    beforeEach(() => {
      reader = readChunks('abc', 'def');
    });

    it('searches across chunks', async () => {
      await expect(reader.search('e')).resolves.toBe(1);
      expect(reader.current).toBe('def');
      expect(reader.prev).toEqual(['abc']);
    });
    it('iterates all chunks when not found', async () => {
      await expect(reader.search('Z')).resolves.toBe(-1);
      expect(reader.current).toBe('def');
      expect(reader.prev).toEqual(['abc']);
    });
  });

  function readChunks(...chunks: string[]): UcdReader {
    return new UcdReader(chunkStream(...chunks));
  }
});
