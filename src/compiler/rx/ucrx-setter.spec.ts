import { describe, expect, it } from '@jest/globals';
import { UccCode } from '../codegen/ucc-code.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { UcrxSetter } from './ucrx-setter.js';

describe('UcrxSetter', () => {
  describe('stub', () => {
    it('sets value', () => {
      const setter = new UcrxSetter({ key: 'test' });

      expect(
        new UccCode()
          .write(setter.stub({ value: 'value' }, new UccMethod('set', setter.args)))
          .toString(),
      ).toBe('return this.set(value);\n');
    });
  });
});
