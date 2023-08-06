import { esline } from 'esgen';
import { ucsWriteAsIs } from '../../serializer/ucs-write-asis.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { UC_MODULE_CHURI, UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsProcessUnknown(setup: UcsSetup): UccConfig {
  return {
    configure() {
      setup.formatWith('charge', 'unknown', ({ writer, value, asItem }) => {
        const chargeURI = UC_MODULE_CHURI.import('chargeURI');
        const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);

        return esline`await ${writeAsIs}(${writer}, ${chargeURI}(${value}, { asItem: ${asItem} }));`;
      });
    },
  };
}
