import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccCode } from '../codegen/ucc-code.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { UcdLib } from '../deserialization/ucd-lib.js';
import { UcdSetup } from '../deserialization/ucd-setup.js';
import { BaseUcrxTemplate } from './base.ucrx-template.js';
import { UcrxSetter } from './ucrx-setter.js';

describe('UcrxSetter', () => {
  let lib: UcdLib;
  let template: BaseUcrxTemplate;

  beforeEach(async () => {
    lib = await new UcdSetup({ models: {} }).bootstrap();
    template = lib.voidUcrx;
  });

  describe('stub', () => {
    it('sets value', async () => {
      const setter = new UcrxSetter({ key: 'test', typeName: 'test-type' });

      await expect(
        new UccCode()
          .write(
            setter.stub(
              { value: 'value', reject: 'reject' },
              new UccMethod('test', setter.args),
              template,
            ),
          )
          .toText(),
      ).resolves.toBe(`return this.any(value) || reject(ucrxRejectType('test-type', this));\n`);
    });
  });
});
