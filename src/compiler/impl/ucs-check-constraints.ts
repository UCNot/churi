import { SERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccBuilder, UccCode, UccSource } from '../codegen/ucc-code.js';
import { UcsFunction } from '../serialization/ucs-function.js';

export function ucsCheckConstraints(
  fn: UcsFunction,
  schema: UcSchema,
  value: string,
  onValue: UccSource,
  {
    onNull,
  }: {
    readonly onNull?: UccSource;
  } = {},
): UccBuilder {
  const { lib, args } = fn;
  const ucsNull = lib.import(SERIALIZER_MODULE, 'UCS_NULL');

  return function checkConstraints(code: UccCode) {
    if (schema.nullable) {
      code.write(`if (${value} != null) {`).indent(onValue);
      if (schema.optional) {
        code.write(`} else if (${value} === null) {`).indent(
          onNull
            ?? (code => {
              code.write(`await ${args.writer}.ready;`, `${args.writer}.write(${ucsNull})`);
            }),
        );
      } else {
        code.write(`} else {`).indent(
          onNull
            ?? (code => {
              code.write(`await ${args.writer}.ready;`, `${args.writer}.write(${ucsNull})`);
            }),
        );
      }
      code.write('}');
    } else if (schema.optional) {
      code.write(`if (${value} != null) {`).indent(onValue).write(`}`);
    } else {
      code.write(onValue);
    }
  };
}
