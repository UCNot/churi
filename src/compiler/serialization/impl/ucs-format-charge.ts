import { EsCode, EsSnippet, esline } from 'esgen';
import { UcSchema } from '../../../schema/uc-schema.js';
import { UC_MODULE_SERIALIZER } from '../../impl/uc-modules.js';
import { UcsFormatter } from '../ucs-formatter.js';

export function ucsFormatCharge<T>(formatter: UcsFormatter<T>): UcsFormatter<T> {
  return (args, schema, context) => {
    const onValue = formatter(args, schema, context);

    return onValue && ucsCheckCharge(args, schema, onValue);
  };
}

export function ucsCheckCharge(
  { writer, value }: { readonly writer: EsSnippet; readonly value: EsSnippet },
  schema: UcSchema,
  onValue: EsSnippet,
  {
    onNull = code => {
      const ucsNull = UC_MODULE_SERIALIZER.import('UCS_NULL');

      code.write(esline`await ${writer}.ready;`, esline`${writer}.write(${ucsNull})`);
    },
  }: {
    readonly onNull?: EsSnippet;
  } = {},
): EsSnippet {
  return function checkConstraints(code: EsCode) {
    if (schema.nullable) {
      code.write(esline`if (${value} != null) {`).indent(onValue);
      if (schema.optional) {
        code.write(esline`} else if (${value} === null) {`).indent(onNull);
      } else {
        code.write(`} else {`).indent(onNull);
      }
      code.write('}');
    } else if (schema.optional) {
      code
        .write(esline`if (${value} != null) {`)
        .indent(onValue)
        .write(`}`);
    } else {
      code.write(onValue);
    }
  };
}
