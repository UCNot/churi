import { UcsFeature, UcsSchemaFeature } from '../compiler/serialization/ucs-feature.js';
import { UcSchema } from '../schema/uc-schema.js';
import { UcsWriter } from '../serializer/ucs-writer.js';
import { writeUcAsIs } from '../serializer/write-uc-asis.js';

export async function writeUcHexNumber(writer: UcsWriter, value: number): Promise<void> {
  await writeUcAsIs(writer, '0x' + value.toString(16));
}

export const UcsSupportNumberAsHex: UcsFeature.Object = {
  configureSerializer(setup) {
    setup.useUcsGenerator<number>(Number, (fn, _schema, value) => {
      const { lib, args } = fn;
      const write = lib.import('churi/spec', 'writeUcHexNumber');

      return `await ${write}(${args.writer}, ${value});`;
    });
  },
};

export const UcsSupportHexNumber: UcsFeature.Object = {
  configureSerializer(setup) {
    setup.useUcsGenerator<number>('hexNumber', (fn, _schema, value) => {
      const { lib, args } = fn;
      const write = lib.import('churi/spec', 'writeUcHexNumber');

      return `await ${write}(${args.writer}, ${value});`;
    });
  },
};

export const UcsSupportHexNumberSchema: UcsSchemaFeature.Object = {
  configureSchemaSerializer(setup, schema: UcSchema<number>) {
    setup.useUcsGenerator(schema.type, (fn, _schema, value) => {
      const { lib, args } = fn;
      const write = lib.import('churi/spec', 'writeUcHexNumber');

      return `await ${write}(${args.writer}, ${value});`;
    });
  },
};
