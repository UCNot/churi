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
});
