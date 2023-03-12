import { describe, expect, it } from '@jest/globals';
import { UccCode } from './ucc-code.js';
import { uccInitProperty } from './ucc-object-init.js';

describe('uccInitProperty', () => {
  it('generates lambda variable', () => {
    expect(
      new UccCode()
        .write(
          uccInitProperty(
            (prefix, suffix) => code => code
                .write(`${prefix.asMethod('a', 'b')}{`)
                .indent(`return a + b;`)
                .write(`}${suffix}`),
            `const sum = `,
            `;`,
            'sum',
          ),
        )
        .toString(),
    ).toBe(`const sum = (a, b) => {\n  return a + b;\n};\n`);
  });
});
