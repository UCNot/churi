import { esline } from 'esgen';
import { UC_MODULE_CHURI, UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UcsCompiler } from './ucs-compiler.js';

export function ucsSupportUnknown(compiler: UcsCompiler): void {
  compiler.useUcsGenerator('unknown', (_fn, _schema, { writer, value, asItem }) => {
    const chargeURI = UC_MODULE_CHURI.import('chargeURI');
    const writeUcAsIs = UC_MODULE_SERIALIZER.import('writeUcAsIs');

    return esline`await ${writeUcAsIs}(${writer}, ${chargeURI}(${value}, { asItem: ${asItem} }));`;
  });
}
