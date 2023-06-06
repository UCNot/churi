import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdSetup } from '../deserialization/ucd-setup.js';
import { ucdSupportDefaults } from '../deserialization/ucd-support-defaults.js';
import { UcrxSetter } from './ucrx-setter.js';

describe('UcrxSetter', () => {
  let setup: UcdSetup;

  beforeEach(() => {
    setup = new UcdSetup({
      models: {
        readValue: Number,
      },
      features: [
        ucdSupportDefaults,
        setup => {
          setup.declareUcrxMethod(new UcrxSetter('test', { typeName: 'test-type' }));
        },
      ],
    });
  });

  describe('stub', () => {
    it('sets value', async () => {
      await expect(setup.generate()).resolves.toContain(
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
