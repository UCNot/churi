import { esline } from 'esgen';
import { ucsWriteAsIs } from '../../serializer/ucs-write-asis.js';
import { UC_MODULE_CHURI, UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UcsBootstrap } from './ucs-bootstrap.js';

export function ucsProcessUnknown(boot: UcsBootstrap): void {
  boot.formatWith('charge', 'unknown', ({ writer, value, asItem }) => {
    const chargeURI = UC_MODULE_CHURI.import('chargeURI');
    const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);

    return esline`await ${writeAsIs}(${writer}, ${chargeURI}(${value}, { asItem: ${asItem} }));`;
  });
}
