import { esline } from 'esgen';
import { UccFeature } from '../compiler/bootstrap/ucc-feature.js';
import { UC_MODULE_SPEC } from '../compiler/impl/uc-modules.js';
import { UcsBootstrap } from '../compiler/serialization/ucs-bootstrap.js';
import { UcSchema } from '../schema/uc-schema.js';
import { ucsWriteAsIs } from '../serializer/ucs-write-asis.js';
import { UcsWriter } from '../serializer/ucs-writer.js';

export async function writeUcRadixNumber(writer: UcsWriter, value: number): Promise<void> {
  const { radix = 16 } = writer.data;

  await ucsWriteAsIs(writer, (radix === 16 ? '0x' : '') + value.toString(Number(radix)));
}

export const UcsProcessNumberWithRadix: UccFeature.Object<UcsBootstrap> = {
  uccProcess(compiler) {
    return {
      configure() {
        compiler.formatWith<number>('charge', Number, ({ writer, value }) => {
          const write = UC_MODULE_SPEC.import(writeUcRadixNumber.name);

          return esline`await ${write}(${writer}, ${value});`;
        });
      },
    };
  },
};

export const UcsProcessRadixNumber: UccFeature.Object<UcsBootstrap> = {
  uccProcess(compiler) {
    return {
      configure() {
        compiler.formatWith<number>('charge', 'radixNumber', ({ writer, value }) => {
          const write = UC_MODULE_SPEC.import(writeUcRadixNumber.name);

          return esline`await ${write}(${writer}, ${value});`;
        });
      },
    };
  },
};

export const UcsProcessRadixNumberSchema: UccFeature.Object<UcsBootstrap> = {
  uccProcess(boot) {
    return {
      configureSchema(schema: UcSchema<number>) {
        boot.formatWith('charge', schema.type, ({ writer, value }) => {
          const write = UC_MODULE_SPEC.import(writeUcRadixNumber.name);

          return esline`await ${write}(${writer}, ${value});`;
        });
      },
    };
  },
};
