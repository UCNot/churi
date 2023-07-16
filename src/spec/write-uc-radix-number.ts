import { esline } from 'esgen';
import { UC_MODULE_SPEC } from '../compiler/impl/uc-modules.js';
import { UccFeature } from '../compiler/processor/ucc-feature.js';
import { UccSchemaFeature } from '../compiler/processor/ucc-schema-feature.js';
import { UcsCompiler } from '../compiler/serialization/ucs-compiler.js';
import { UcSchema } from '../schema/uc-schema.js';
import { ucsWriteAsIs } from '../serializer/ucs-write-asis.js';
import { UcsWriter } from '../serializer/ucs-writer.js';

export async function writeUcRadixNumber(writer: UcsWriter, value: number): Promise<void> {
  const { radix = 16 } = writer.data;

  await ucsWriteAsIs(writer, (radix === 16 ? '0x' : '') + value.toString(Number(radix)));
}

export const UcsSupportNumberWithRadix: UccFeature.Object<UcsCompiler> = {
  uccProcess(compiler) {
    return {
      configure() {
        compiler.useUcsGenerator<number>(Number, (_fn, _schema, { writer, value }) => {
          const write = UC_MODULE_SPEC.import('writeUcRadixNumber');

          return esline`await ${write}(${writer}, ${value});`;
        });
      },
    };
  },
};

export const UcsSupportRadixNumber: UccFeature.Object<UcsCompiler> = {
  uccProcess(compiler) {
    return {
      configure() {
        compiler.useUcsGenerator<number>('radixNumber', (_fn, _schema, { writer, value }) => {
          const write = UC_MODULE_SPEC.import('writeUcRadixNumber');

          return esline`await ${write}(${writer}, ${value});`;
        });
      },
    };
  },
};

export const UcsSupportRadixNumberSchema: UccSchemaFeature.Object<UcsCompiler> = {
  uccProcessSchema(compiler, schema: UcSchema<number>) {
    return {
      configure() {
        compiler.useUcsGenerator(schema.type, (_fn, _schema, { writer, value }) => {
          const write = UC_MODULE_SPEC.import('writeUcRadixNumber');

          return esline`await ${write}(${writer}, ${value});`;
        });
      },
    };
  },
};