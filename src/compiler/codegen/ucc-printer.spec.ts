import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccPrinter } from './ucc-printer.js';

describe('UccPrinter', () => {
  let printer: UccPrinter;

  beforeEach(() => {
    printer = new UccPrinter();
  });

  describe('indent', () => {
    it('indents lines', async () => {
      await expect(
        printer
          .print('{')
          .indent(lines => lines
              .print('{')
              .indent(lines => lines.print('foo();', 'bar();'), '/* indent */ ')
              .print('}'))
          .print('}')
          .toText(),
      ).resolves.toBe('{\n  {\n  /* indent */ foo();\n  /* indent */ bar();\n  }\n}\n');
    });
  });

  describe('print', () => {
    it('appends new line without indentation', async () => {
      await expect(
        printer
          .print('{')
          .indent(lines => lines.print())
          .print('}')
          .toText(),
      ).resolves.toBe('{\n\n}\n');
    });
    it('appends new line without indentation instead of empty line', async () => {
      await expect(
        printer
          .print('{')
          .indent(lines => lines.print(''))
          .print('}')
          .toText(),
      ).resolves.toBe('{\n\n}\n');
    });
    it('appends at most one new line', async () => {
      await expect(
        printer
          .print('{')
          .indent(lines => lines.print().print('').print())
          .print('}')
          .toText(),
      ).resolves.toBe('{\n\n}\n');
    });
  });
});
