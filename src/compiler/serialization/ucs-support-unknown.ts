import { esline } from 'esgen';
import { UC_MODULE_CHURI, UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcsCompiler } from './ucs-compiler.js';

export function ucsSupportUnknown(compiler: UcsCompiler): UccConfig {
  return {
    configure() {
      compiler.formatWith('unknown', ({ writer, value, asItem }) => {
        const chargeURI = UC_MODULE_CHURI.import('chargeURI');
        const writeAsIs = UC_MODULE_SERIALIZER.import('ucsWriteAsIs');

        return esline`await ${writeAsIs}(${writer}, ${chargeURI}(${value}, { asItem: ${asItem} }));`;
      });
    },
  };
}
