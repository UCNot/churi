import { EsCode, EsSnippet, esline } from 'esgen';
import { UcSchema } from '../../../../schema/uc-schema.js';
import { UC_MODULE_SERIALIZER } from '../../../impl/uc-modules.js';
import { UcsFormatter, UcsFormatterSignature } from '../../ucs-formatter.js';

export function ucsFormatJSON<T>(formatter: UcsFormatter<T>): UcsFormatter<T> {
  return (args, schema, context) => ucsCheckJSON(args, schema, formatter(args, schema, context));
}

export function ucsWriteJSONNull(writer: EsSnippet): EsSnippet {
  return code => {
    const jsonNull = UC_MODULE_SERIALIZER.import('UCS_JSON_NULL');

    code.write(esline`await ${writer}.ready;`, esline`${writer}.write(${jsonNull})`);
  };
}

export function ucsCheckJSON(
  { writer, value }: UcsFormatterSignature.Values,
  schema: UcSchema,
  onValue: EsSnippet,
): EsSnippet {
  return function checkConstraints(code: EsCode) {
    if (schema.nullable || schema.optional) {
      code
        .write(esline`if (${value} != null) {`)
        .indent(onValue)
        .write(`} else {`)
        .indent(ucsWriteJSONNull(writer))
        .write('}');
    } else {
      code.write(onValue);
    }
  };
}
