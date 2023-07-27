import { esline } from 'esgen';
import { UC_MODULE_CHURI, UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportUnknown(setup: UcsSetup): UccConfig {
  return {
    configure() {
      setup.formatWith('charge', 'unknown', ({ writer, value, asItem }) => {
        const chargeURI = UC_MODULE_CHURI.import('chargeURI');
        const writeAsIs = UC_MODULE_SERIALIZER.import('ucsWriteAsIs');

        return esline`await ${writeAsIs}(${writer}, ${chargeURI}(${value}, { asItem: ${asItem} }));`;
      });
    },
  };
}
