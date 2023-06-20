import { esline } from 'esgen';
import { UC_MODULE_SPEC } from '../compiler/impl/uc-modules.js';
import { UccFeature } from '../compiler/processor/ucc-feature.js';
import { UccSchemaFeature } from '../compiler/processor/ucc-schema-feature.js';
import { UcsCompiler } from '../compiler/serialization/ucs-compiler.js';
import { UcSchema } from '../schema/uc-schema.js';
import { ucsWriteAsIs } from '../serializer/ucs-write-asis.js';
import { UcsWriter } from '../serializer/ucs-writer.js';

export async function writeUcHexNumber(writer: UcsWriter, value: number): Promise<void> {
  await ucsWriteAsIs(writer, '0x' + value.toString(16));
}

export const UcsSupportNumberAsHex: UccFeature.Object<UcsCompiler> = {
  uccProcess(compiler) {
    return {
      configure() {
        compiler.useUcsGenerator<number>(Number, (_fn, _schema, { writer, value }) => {
          const write = UC_MODULE_SPEC.import('writeUcHexNumber');

          return esline`await ${write}(${writer}, ${value});`;
        });
      },
    };
  },
};

export const UcsSupportHexNumber: UccFeature.Object<UcsCompiler> = {
  uccProcess(compiler) {
    return {
      configure() {
        compiler.useUcsGenerator<number>('hexNumber', (_fn, _schema, { writer, value }) => {
          const write = UC_MODULE_SPEC.import('writeUcHexNumber');

          return esline`await ${write}(${writer}, ${value});`;
        });
      },
    };
  },
};

export const UcsSupportHexNumberSchema: UccSchemaFeature.Object<UcsCompiler> = {
  uccProcessSchema(compiler, schema: UcSchema<number>) {
    return {
      configure() {
        compiler.useUcsGenerator(schema.type, (_fn, _schema, { writer, value }) => {
          const write = UC_MODULE_SPEC.import('writeUcHexNumber');

          return esline`await ${write}(${writer}, ${value});`;
        });
      },
    };
  },
};
