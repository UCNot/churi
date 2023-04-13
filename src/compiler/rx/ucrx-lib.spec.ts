import { describe, expect, it } from '@jest/globals';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcrxLib } from './ucrx-lib.js';
import { UcrxTemplate } from './ucrx-template.js';

describe('UcrxLib', () => {
  describe('resolver', () => {
    it('has default value', () => {
      class Lib extends UcrxLib {

        override ucrxTemplateFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
          _schema: TSchema,
        ): UcrxTemplate<T, TSchema> {
          throw new Error('Unsupported');
        }

}

      expect(new Lib({}).resolver).toBeDefined();
    });
  });
});
