import { describe, expect, it } from '@jest/globals';
import { UcsCompiler } from '../../../compiler/serialization/ucs-compiler.js';
import { ucsSupportURIEncoded } from '../../../compiler/serialization/ucs-support-uri-encoded.js';
import { ucsSupportURIParams } from '../../../compiler/serialization/ucs-support-uri-params.js';
import { ucMap } from '../../../schema/map/uc-map.js';
import { ucBigInt } from '../../../schema/numeric/uc-bigint.js';
import { TextOutStream } from '../../../spec/text-out-stream.js';
import { ucInsetURIEncoded } from '../uri-encoded/uc-inset-uri-encoded.js';

describe('URI params serializer', () => {
  it('serializes bigint', async () => {
    const compiler = new UcsCompiler({
      capabilities: [ucsSupportURIEncoded, ucsSupportURIParams],
      models: {
        writeParams: {
          model: ucMap({
            test: ucBigInt({
              string: 'serialize',
              within: {
                uriParam: ucInsetURIEncoded(),
              },
            }),
          }),
          format: 'uriParams',
        },
      },
    });

    const { writeParams } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeParams(to, { test: -13n })),
    ).resolves.toBe('test=-0n13');
  });
});
