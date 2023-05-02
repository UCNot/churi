import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccBundle } from '../../compiler/codegen/ucc-bundle.js';
import { UcdLib } from '../../compiler/deserialization/ucd-lib.js';
import { UcdSetup } from '../../compiler/deserialization/ucd-setup.js';
import { UcsLib } from '../../compiler/serialization/ucs-lib.js';
import { UcsSetup } from '../../compiler/serialization/ucs-setup.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcNullable } from '../uc-nullable.js';
import { UcModel } from '../uc-schema.js';
import { UcSerializer } from '../uc-serializer.js';
import { UcUnknown, ucUnknown } from './uc-unknown.js';

describe('UcUnknown bundle', () => {
  let bundle: UccBundle;
  let ucdLib: UcdLib<{ readValue: UcNullable<unknown, UcUnknown.Schema> }>;
  let ucsLib: UcsLib<{ writeValue: UcModel }>;

  beforeEach(async () => {
    bundle = new UccBundle();
    ucdLib = await new UcdSetup({ bundle, models: { readValue: ucUnknown() } }).bootstrap();
    ucsLib = await new UcsSetup({ bundle, models: { writeValue: ucUnknown() } }).bootstrap();
  });

  describe('factory', () => {
    let readValue: UcDeserializer<unknown>;
    let writeValue: UcSerializer<unknown>;

    beforeEach(async () => {
      ({ readValue } = await ucdLib.compileFactory().toExports());
      ({ writeValue } = await ucsLib.compileFactory().toExports());
    });

    it('serializes and deserializes number', async () => {
      const num = await TextOutStream.read(async writer => await writeValue(writer, 13));

      expect(readValue(num)).toBe(13);
    });
    it('serializes and deserializes string', async () => {
      const num = await TextOutStream.read(async writer => await writeValue(writer, '13'));

      expect(readValue(num)).toBe('13');
    });
  });

  describe('bundle.compile', () => {
    it('contains both serializer and deserializer', async () => {
      const text = await bundle.compile().toText();

      expect(text).toContain(`export function readValue(`);
      expect(text).toContain(`export async function writeValue(`);
    });
  });
});
