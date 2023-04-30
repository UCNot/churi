import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcsFunction } from '../../compiler/serialization/ucs-function.js';
import { UcsLib } from '../../compiler/serialization/ucs-lib.js';
import { UcsSetup } from '../../compiler/serialization/ucs-setup.js';
import { SPEC_MODULE } from '../../impl/module-names.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { UcModel, UcSchema } from '../uc-schema.js';
import { UcSerializer } from '../uc-serializer.js';

describe('UcString serializer', () => {
  let lib: UcsLib<{ writeValue: UcModel<string> }>;
  let writeValue: UcSerializer<string>;

  beforeEach(async () => {
    lib = await new UcsSetup({
      models: {
        writeValue: String,
      },
    }).bootstrap();
    ({ writeValue } = await lib.compile().toSerializers());
  });

  it('percent-encodes special symbols', async () => {
    await expect(
      TextOutStream.read(async to => await writeValue(to, 'Hello, %(World)!')),
    ).resolves.toBe("'Hello%2C %25%28World%29!");
  });
  it('retains tab, space, new line and line feed', async () => {
    await expect(TextOutStream.read(async to => await writeValue(to, '\t \n \r\n'))).resolves.toBe(
      "'\t \n \r\n",
    );
  });
  it('percent-encodes control chars', async () => {
    const value =
      '\0\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u000b\u000c\u000e\u000f'
      + '\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019';

    await expect(TextOutStream.read(async to => await writeValue(to, value))).resolves.toBe(
      `'${encodeURIComponent(value)}`,
    );
  });
  it('escapes empty string', async () => {
    await expect(TextOutStream.read(async to => await writeValue(to, ''))).resolves.toBe("'");
  });
  it('writes multiple chunks', async () => {
    lib = await new UcsSetup({
      models: {
        writeValue: String,
      },
      createSerializer<T, TSchema extends UcSchema<T>>(options: UcsFunction.Options<T, TSchema>) {
        return new UcsFunction<T, TSchema>({
          ...options,
          createWriter(serializer, writer, stream) {
            const UcsWriter = serializer.lib.import(SPEC_MODULE, 'SmallChunkUcsWriter');

            return `const ${writer} = new ${UcsWriter}(${stream}, 4);`;
          },
        });
      },
    }).bootstrap();
    ({ writeValue } = await lib.compile().toSerializers());

    await expect(
      TextOutStream.read(
        async to => await writeValue(to, '1234567890'),
        undefined,
        new ByteLengthQueuingStrategy({ highWaterMark: 4 }),
      ),
    ).resolves.toBe("'1234567890");
  });
});
