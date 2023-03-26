import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccCode } from '../codegen/ucc-code.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { UcdLib } from '../deserialization/ucd-lib.js';
import { BaseUcrxTemplate } from './base.ucrx-template.js';
import { UcrxSetter } from './ucrx-setter.js';

describe('UcrxSetter', () => {
  let lib: UcdLib;
  let template: BaseUcrxTemplate;

  beforeEach(() => {
    lib = new UcdLib({ schemae: {} });
    template = lib.voidUcrx;
  });

  describe('stub', () => {
    it('sets value', () => {
      const setter = new UcrxSetter({ key: 'test' });

      expect(
        new UccCode()
          .write(setter.stub({ value: 'value' }, new UccMethod('test', setter.args), template))
          .toString(),
      ).toBe('return this.set(value);\n');
    });
  });
});
