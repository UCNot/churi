import { esline } from 'esgen';
import { UcString } from '../../schema/string/uc-string.js';
import { UcDataType } from '../../schema/uc-schema.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcsCompiler } from './ucs-compiler.js';

export function ucsSupportString(
  compiler: UcsCompiler,
  target: UcString.Schema | UcDataType<UcString>,
): UccConfig<UcString.Variant> {
  return {
    configure({ raw = 'escape' }) {
      compiler.useUcsGenerator(target, (_fn, schema, { writer, value, asItem }) => {
        const writeString = UC_MODULE_SERIALIZER.import(
          raw === 'escape'
            ? 'ucsWriteString'
            : schema.nullable
            ? 'ucsWriteNullableRawString'
            : 'ucsWriteRawString',
        );

        return esline`await ${writeString}(${writer}, ${value}, ${asItem});`;
      });
    },
  };
}
