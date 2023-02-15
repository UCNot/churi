import { describe, expect, it } from '@jest/globals';
import { chunkStream } from '../../spec/chunk-stream.js';
import { PerLineStream } from './per-line-stream.js';

describe('PerLineStream', () => {
  it('handles single line', async () => {
    await expect(splitLines('abcdef')).resolves.toEqual(['abcdef']);
  });
  it('handles CR and LF at different chunks', async () => {
    await expect(splitLines(`abc\r`, `\ndef`)).resolves.toEqual([`abc\r\n`, 'def']);
    await expect(splitLines(`abc\r`, `\ndef\r`, `\ng\r`, `\n`)).resolves.toEqual([
      'abc\r\n',
      'def\r\n',
      'g\r\n',
    ]);
  });
  it('ignores empty lines between CR and LF', async () => {
    await expect(splitLines(`abc\r`, '', '', `\ndef`)).resolves.toEqual([`abc\r\n`, 'def']);
    await expect(splitLines(`abc\r`, '', `\ndef\r`, '', `\ng\r`, `\n`)).resolves.toEqual([
      'abc\r\n',
      'def\r\n',
      'g\r\n',
    ]);
  });

  describe.each([
    ['LF', '\n'],
    ['CR', '\r'],
    ['CR LF', '\r\n'],
  ])(`Delimited with %s`, (_name, nl) => {
    it(`splits two lines`, async () => {
      await expect(splitLines(`abc${nl}def`)).resolves.toEqual([`abc${nl}`, 'def']);
    });
    it('splits multiple lines', async () => {
      await expect(splitLines(`abc${nl}def${nl}g`)).resolves.toEqual([`abc${nl}`, `def${nl}`, `g`]);
    });
    it('handles trailing line separator', async () => {
      await expect(splitLines(`abc${nl}`)).resolves.toEqual([`abc${nl}`]);
      await expect(splitLines(`abc${nl}def${nl}g${nl}`)).resolves.toEqual([
        `abc${nl}`,
        `def${nl}`,
        `g${nl}`,
      ]);
    });
    it(`handles chunk ending with separator`, async () => {
      await expect(splitLines(`abc${nl}`, `def`)).resolves.toEqual([`abc${nl}`, 'def']);
      await expect(splitLines(`abc${nl}`, `def${nl}`, 'g')).resolves.toEqual([
        `abc${nl}`,
        `def${nl}`,
        'g',
      ]);
    });
    it(`handles chunk starting with separator`, async () => {
      await expect(splitLines(`abc`, `${nl}def`)).resolves.toEqual([`abc${nl}`, 'def']);
      await expect(splitLines(`abc`, `${nl}def`, `${nl}g`)).resolves.toEqual([
        `abc${nl}`,
        `def${nl}`,
        'g',
      ]);
    });
  });

  async function splitLines(...chunks: string[]): Promise<string[]> {
    return await readLines(chunkStream(...chunks).pipeThrough(new PerLineStream()));
  }

  async function readLines(stream: ReadableStream<string>): Promise<string[]> {
    const lines: string[] = [];
    const reader = stream.getReader();

    try {
      for (;;) {
        const { value, done } = await reader.read();

        if (value != null) {
          lines.push(value);
        }

        if (done) {
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }

    return lines;
  }
});
