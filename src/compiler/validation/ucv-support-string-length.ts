import { esStringLiteral, esline } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';
import { UC_MODULE_VALIDATOR } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxProcessor } from '../rx/ucrx-processor.js';
import { ucvValidate } from './ucv-validate.js';

export type UcvStringLength = [op: '<=' | '>=', than: number, or?: string | undefined];

export function ucvSupportStringLength(
  processor: UcrxProcessor.Any,
  schema: UcSchema<string>,
): UccConfig<UcvStringLength> {
  return {
    configure([op, than, or]) {
      processor.modifyUcrxMethod(schema, UcrxCore.str, {
        before({ member: { args } }) {
          return ucvValidate(args, ({ value, reject }) => code => {
            const bound = String(than);
            const message = or != null ? `, ${esStringLiteral(or)}` : '';
            const ucvReject = UC_MODULE_VALIDATOR.import(`ucvReject${UcvStringLength$reject[op]}`);

            code
              .write(esline`if (${value}.length ${UcvStringReject$reverseOp[op]} ${bound}) {`)
              .indent(reject(esline`${ucvReject}(${bound}${message})`))
              .write('}');
          });
        },
      });
    },
  };
}

const UcvStringLength$reject: { readonly [key in UcvStringLength['0']]: string } = {
  '>=': 'TooShort',
  '<=': 'TooLong',
};

const UcvStringReject$reverseOp: { readonly [key in UcvStringLength['0']]: '>' | '<' } = {
  '>=': '<',
  '<=': '>',
};
