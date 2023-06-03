import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcsSetup } from '../../compiler/serialization/ucs-setup.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { UcModel } from '../uc-schema.js';
import { UcSerializer } from '../uc-serializer.js';

describe('UcBigInt serializer', () => {
  let setup: UcsSetup<{ writeValue: UcModel<bigint> }>;
  let writeValue: UcSerializer<bigint>;

  beforeEach(async () => {
    setup = new UcsSetup({
      models: {
        writeValue: BigInt,
      },
    });
    ({ writeValue } = await setup.evaluate());
  });

  it('serializes value', async () => {
    await expect(TextOutStream.read(async to => await writeValue(to, 0n))).resolves.toBe('0n0');
    await expect(TextOutStream.read(async to => await writeValue(to, 13n))).resolves.toBe('0n13');
    await expect(TextOutStream.read(async to => await writeValue(to, -13n))).resolves.toBe('-0n13');
  });
});
