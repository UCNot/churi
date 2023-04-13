import { CHURI_MODULE, SERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportUnknown(setup: UcsSetup): void {
  setup.useUcsGenerator('unknown', ({ lib, args: { writer } }, _schema, value, asItem) => {
    const chargeURI = lib.import(CHURI_MODULE, 'chargeURI');
    const writeUcAsIs = lib.import(SERIALIZER_MODULE, 'writeUcAsIs');

    return `await ${writeUcAsIs}(${writer}, ${chargeURI}(${value}, { asItem: ${asItem} }));`;
  });
}
