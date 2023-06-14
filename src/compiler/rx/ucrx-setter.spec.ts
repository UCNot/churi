import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../deserialization/ucd-compiler.js';
import { ucdSupportDefaults } from '../deserialization/ucd-support-defaults.js';
import { UcrxSetter } from './ucrx-setter.js';

describe('UcrxSetter', () => {
  let compiler: UcdCompiler;

  beforeEach(() => {
    compiler = new UcdCompiler({
      models: {
        readValue: Number,
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
  test(value, reject) {
    return this.any(value) || reject(ucrxRejectType('test-type', this));
  }
}`.trimStart(),
      );
    });
  });
});
