import { esline } from 'esgen';
import { UcBigInt } from '../../../../schema/numeric/uc-bigint.js';
import { ucsWriteAsIs } from '../../../../serializer/ucs-write-asis.js';
import {
  ucsWriteBigIntJSON,
  ucsWriteBigIntOrNumberJSON,
} from '../../../../serializer/ucs-write-bigint.js';
import { UnsupportedUcSchemaError } from '../../../common/unsupported-uc-schema.error.js';
import { UC_MODULE_SERIALIZER } from '../../../impl/uc-modules.js';
import { UcsFormatter } from '../../ucs-formatter.js';
import { ucsFormatJSON } from './ucs-format-json.js';

export function ucsFormatJSONBigInt({
  string,
  number,
}: UcBigInt.Variant = {}): UcsFormatter<UcBigInt> {
  return ucsFormatJSON(({ writer, value }, schema) => code => {
    const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);

    if (string === 'reject' && number !== 'serialize') {
      throw new UnsupportedUcSchemaError(schema, `BigInt value has to be representable as string`);
    }
    if (number === 'reject') {
      // Prefix with `0n`, as otherwise the value will be rejected.
      const writeBigInt = UC_MODULE_SERIALIZER.import(ucsWriteBigIntJSON.name);

      code.write(esline`await ${writeBigInt}(${writer}, ${value});`);
    } else if (string === 'serialize') {
      code.write(esline`await ${writeAsIs}(writer, \`"\${${value}}"\`);`);
    } else if (number === 'serialize') {
      code.write(esline`await ${writeAsIs}(${writer}, String(${value}));`);
    } else {
      const writeBigIntOrNumber = UC_MODULE_SERIALIZER.import(ucsWriteBigIntOrNumberJSON.name);

      code.write(esline`await ${writeBigIntOrNumber}(${writer}, ${value});`);
    }
  });
}
