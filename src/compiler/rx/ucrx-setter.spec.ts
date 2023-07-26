import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../deserialization/ucd-compiler.js';
import { ucdSupportDefaults } from '../deserialization/ucd-support-defaults.js';
import { UcrxSetter } from './ucrx-setter.js';

describe('UcrxSetter', () => {
  let compiler: UcdCompiler;

  beforeEach(() => {
    compiler = new UcdCompiler({
      models: {
        readValue: { model: Number },
      },
      features: [
        ucdSupportDefaults,
        compiler => ({
          configure() {
            compiler.declareUcrxMethod(new UcrxSetter('test', { typeName: 'test-type' }));
          },
        }),
      ],
    });
  });

  describe('stub', () => {
    it('sets value', async () => {
      await expect(compiler.generate()).resolves.toContain(
        `
class BaseUcrx extends VoidUcrx {
  test(value, cx) {
    return this.any(value) || cx.reject(ucrxRejectType('test-type', this));
  }
}`.trimStart(),
      );
    });
  });
});
