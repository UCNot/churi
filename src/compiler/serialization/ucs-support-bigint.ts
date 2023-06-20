import { esline } from 'esgen';
import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { UcDataType } from '../../schema/uc-schema.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcsCompiler } from './ucs-compiler.js';

export function ucsSupportBigInt(
  compiler: UcsCompiler,
  target: UcBigInt.Schema | UcDataType<UcBigInt> = BigInt,
): UccConfig<UcBigInt.Variant | void> {
  return {
    configure({ string = 'parse', number = 'parse' } = {}) {
      compiler.useUcsGenerator(target, (_fn, _schema, { writer, value }) => code => {
        if (string === 'serialize') {
          const ucsApostrophe = UC_MODULE_SERIALIZER.import('UCS_APOSTROPHE');

          code
            .write(esline`await ${writer}.ready;`)
            .write(esline`${writer}.write(${ucsApostrophe});`);
        }
        if (number === 'serialize') {
          const writeAsIs = UC_MODULE_SERIALIZER.import('ucsWriteAsIs');

          code
            .write(esline`await ${writer}.ready;`)
            .write(esline`await ${writeAsIs}(${writer}, ${value}.toString());`);
        } else {
          const writeBigInt = UC_MODULE_SERIALIZER.import(
            number === 'auto' ? 'ucsWriteBigIntOrNumber' : 'ucsWriteBigInt',
          );

          code.write(esline`await ${writeBigInt}(${writer}, ${value});`);
        }
      });
    },
  };
}
