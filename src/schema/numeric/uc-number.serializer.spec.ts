import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcsSetup } from '../../compiler/serialization/ucs-setup.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { UcModel } from '../uc-schema.js';
import { UcSerializer } from '../uc-serializer.js';

describe('UcNumber serializer', () => {
  let setup: UcsSetup<{ writeValue: UcModel<number> }>;
  let writeValue: UcSerializer<number>;

  beforeEach(async () => {
    setup = new UcsSetup({
      models: {
        writeValue: Number,
      },
    });
    ({ writeValue } = await setup.evaluate());
  });

  it('serializes number', async () => {
    await expect(TextOutStream.read(async to => await writeValue(to, 13))).resolves.toBe('13');
    await expect(TextOutStream.read(async to => await writeValue(to, -13))).resolves.toBe('-13');
  });
  it('serializes `NaN`', async () => {
    await expect(TextOutStream.read(async to => await writeValue(to, NaN))).resolves.toBe('!NaN');
  });
  it('serializes infinity', async () => {
    await expect(TextOutStream.read(async to => await writeValue(to, Infinity))).resolves.toBe(
      '!Infinity',
    );
    await expect(TextOutStream.read(async to => await writeValue(to, -Infinity))).resolves.toBe(
      '!-Infinity',
    );
  });
});
