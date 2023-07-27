import { esline } from 'esgen';
import { UcNumber } from '../../schema/numeric/uc-number.js';
import { UcDataType } from '../../schema/uc-schema.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcsCompiler } from './ucs-compiler.js';

export function ucsSupportNumber(
  compiler: UcsCompiler,
  target: UcNumber.Schema | UcDataType<UcNumber> = Number,
): UccConfig<UcNumber.Variant | void> {
  return {
    configure({ string = 'parse' } = {}) {
      compiler.formatWith(target, ({ writer, value }) => {
        const writeNumber = UC_MODULE_SERIALIZER.import(
          string === 'serialize' ? 'ucsWriteNumberAsString' : 'ucsWriteNumber',
        );

        return esline`await ${writeNumber}(${writer}, ${value});`;
      });
    },
  };
}
