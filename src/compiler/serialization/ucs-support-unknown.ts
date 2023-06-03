import { esline } from 'esgen';
import { UC_MODULE_CHURI, UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportUnknown(setup: UcsSetup): void {
  setup.useUcsGenerator('unknown', (_fn, _schema, { writer, value, asItem }) => {
    const chargeURI = UC_MODULE_CHURI.import('chargeURI');
    const writeUcAsIs = UC_MODULE_SERIALIZER.import('writeUcAsIs');

    return esline`await ${writeUcAsIs}(${writer}, ${chargeURI}(${value}, { asItem: ${asItem} }));`;
  });
}
