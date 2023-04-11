import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcsLib } from '../../compiler/serialization/ucs-lib.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { UcSchema } from '../uc-schema.js';
import { UcSerializer } from '../uc-serializer.js';
import { UcsSetup } from '../../compiler/serialization/ucs-setup.js';

describe('UcBigInt serializer', () => {
  let lib: UcsLib<{ writeValue: UcSchema.Spec<bigint> }>;
  let writeValue: UcSerializer<bigint>;

  beforeEach(async () => {
    lib = await new UcsSetup({
      schemae: {
        writeValue: BigInt,
      },
    }).bootstrap();
    ({ writeValue } = await lib.compile().toSerializers());
  });

  it('serializes value', async () => {
    await expect(TextOutStream.read(async to => await writeValue(to, 0n))).resolves.toBe('0n0');
    await expect(TextOutStream.read(async to => await writeValue(to, 13n))).resolves.toBe('0n13');
    await expect(TextOutStream.read(async to => await writeValue(to, -13n))).resolves.toBe('-0n13');
  });
});
