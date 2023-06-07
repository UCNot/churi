import { esline } from 'esgen';
import { UC_MODULE_SPEC } from '../compiler/impl/uc-modules.js';
import { UcsFeature, UcsSchemaFeature } from '../compiler/serialization/ucs-feature.js';
import { UcSchema } from '../schema/uc-schema.js';
import { UcsWriter } from '../serializer/ucs-writer.js';
import { writeUcAsIs } from '../serializer/write-uc-asis.js';

export async function writeUcHexNumber(writer: UcsWriter, value: number): Promise<void> {
  await writeUcAsIs(writer, '0x' + value.toString(16));
}

export const UcsSupportNumberAsHex: UcsFeature.Object = {
  configureSerializer(compiler) {
    compiler.useUcsGenerator<number>(Number, (_fn, _schema, { writer, value }) => {
      const write = UC_MODULE_SPEC.import('writeUcHexNumber');

      return esline`await ${write}(${writer}, ${value});`;
    });
  },
};

export const UcsSupportHexNumber: UcsFeature.Object = {
  configureSerializer(compiler) {
    compiler.useUcsGenerator<number>('hexNumber', (_fn, _schema, { writer, value }) => {
      const write = UC_MODULE_SPEC.import('writeUcHexNumber');

      return esline`await ${write}(${writer}, ${value});`;
    });
  },
};

export const UcsSupportHexNumberSchema: UcsSchemaFeature.Object = {
  configureSchemaSerializer(compiler, schema: UcSchema<number>) {
    compiler.useUcsGenerator(schema.type, (_fn, _schema, { writer, value }) => {
      const write = UC_MODULE_SPEC.import('writeUcHexNumber');

      return esline`await ${write}(${writer}, ${value});`;
    });
  },
};
