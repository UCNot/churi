import { EsSnippet, esline } from 'esgen';
import { UcInteger } from '../../../../schema/numeric/uc-integer.js';
import { UcNumber } from '../../../../schema/numeric/uc-number.js';
import { ucsWriteAsIs } from '../../../../serializer/ucs-write-asis.js';
import { UC_MODULE_SERIALIZER } from '../../../impl/uc-modules.js';
import { UcsFormatter } from '../../ucs-formatter.js';

export function ucsFormatJSONNumber(variant?: UcNumber.Variant): UcsFormatter<UcNumber> {
  return ucsFormatJSONNumeric(
    variant?.string === 'serialize'
      ? value => esline`\`"\${${value}}"\``
      : value => esline`String(${value})`,
  );
}

export function ucsFormatJSONInteger(variant?: UcInteger.Variant): UcsFormatter<UcInteger> {
  return ucsFormatJSONNumeric(
    variant?.string === 'serialize'
      ? value => esline`\`"\${${value}.toFixed(0)}"\``
      : value => esline`${value}.toFixed(0)`,
  );
}

function ucsFormatJSONNumeric(toString: (value: EsSnippet) => EsSnippet): UcsFormatter<UcNumber> {
  return ({ writer, value }) =>
    code => {
      const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);
      const jsonNull = UC_MODULE_SERIALIZER.import('UCS_JSON_NULL');

      code
        .write(esline`if (Number.isFinite(${value})) {`)
        .indent(esline`await ${writeAsIs}(${writer}, ${toString(value)});`)
        .write('} else {')
        .indent(esline`await ${writer}.ready;`, esline`${writer}.write(${jsonNull});`)
        .write('}');
    };
}
