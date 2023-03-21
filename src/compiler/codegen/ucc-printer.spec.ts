import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccPrinter } from './ucc-printer.js';

describe('UccPrinter', () => {
  let printer: UccPrinter;

  beforeEach(() => {
    printer = new UccPrinter();
  });

  describe('indent', () => {
    it('indents lines', () => {
      expect(
        printer
          .print('{')
          .indent(lines => lines
              .print('{')
              .indent(lines => lines.print('foo();', 'bar();'), '/* indent */ ')
              .print('}'))
          .print('}')
          .toString(),
      ).toBe('{\n  {\n  /* indent */ foo();\n  /* indent */ bar();\n  }\n}\n');
    });
  });

  describe('print', () => {
    it('appends new line without indentation', () => {
      expect(
        printer
          .print('{')
          .indent(lines => lines.print())
          .print('}')
          .toString(),
      ).toBe('{\n\n}\n');
    });
    it('appends new line without indentation instead of empty line', () => {
      expect(
        printer
          .print('{')
          .indent(lines => lines.print(''))
          .print('}')
          .toString(),
      ).toBe('{\n\n}\n');
    });
    it('appends at most one new line', () => {
      expect(
        printer
          .print('{')
          .indent(lines => lines.print().print('').print())
          .print('}')
          .toString(),
      ).toBe('{\n\n}\n');
    });
  });
});
