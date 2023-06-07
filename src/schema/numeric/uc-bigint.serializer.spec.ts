import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { UcModel } from '../uc-schema.js';
import { UcSerializer } from '../uc-serializer.js';

describe('UcBigInt serializer', () => {
  let compiler: UcsCompiler<{ writeValue: UcModel<bigint> }>;
  let writeValue: UcSerializer<bigint>;

  beforeEach(async () => {
    compiler = new UcsCompiler({
      models: {
        writeValue: BigInt,
      },
    });
    ({ writeValue } = await compiler.evaluate());
  });

  it('serializes value', async () => {
    await expect(TextOutStream.read(async to => await writeValue(to, 0n))).resolves.toBe('0n0');
    await expect(TextOutStream.read(async to => await writeValue(to, 13n))).resolves.toBe('0n13');
    await expect(TextOutStream.read(async to => await writeValue(to, -13n))).resolves.toBe('-0n13');
  });
});
