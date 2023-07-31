import { esline } from 'esgen';
import { UC_MODULE_SPEC } from '../compiler/impl/uc-modules.js';
import { UccFeature } from '../compiler/processor/ucc-feature.js';
import { UcsSetup } from '../compiler/serialization/ucs-setup.js';
import { UcSchema } from '../schema/uc-schema.js';
import { ucsWriteAsIs } from '../serializer/ucs-write-asis.js';
import { UcsWriter } from '../serializer/ucs-writer.js';

export async function writeUcRadixNumber(writer: UcsWriter, value: number): Promise<void> {
  const { radix = 16 } = writer.data;

  await ucsWriteAsIs(writer, (radix === 16 ? '0x' : '') + value.toString(Number(radix)));
}

export const UcsSupportNumberWithRadix: UccFeature.Object<UcsSetup> = {
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

export const UcsSupportRadixNumber: UccFeature.Object<UcsSetup> = {
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

export const UcsSupportRadixNumberSchema: UccFeature.Object<UcsSetup> = {
  uccProcess(setup) {
    return {
      configureSchema(schema: UcSchema<number>) {
        setup.formatWith('charge', schema.type, ({ writer, value }) => {
          const write = UC_MODULE_SPEC.import(writeUcRadixNumber.name);

          return esline`await ${write}(${writer}, ${value});`;
        });
      },
    };
  },
};
