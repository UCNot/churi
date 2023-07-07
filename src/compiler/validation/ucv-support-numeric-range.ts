import { esStringLiteral, esline } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';
import { UC_MODULE_VALIDATOR } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxProcessor } from '../rx/ucrx-processor.js';
import { UcrxSetter } from '../rx/ucrx-setter.js';
import { ucvValidate } from './ucv-validate.js';

export type UcvNumericRange = [
  constraint: 'ItsMax' | 'ItIsLessThan' | 'ItsMin' | 'ItIsGreaterThan',
  than: number | bigint,
  or?: string | undefined,
];

export function ucvSupportNumericRange(
  processor: UcrxProcessor.Any,
  schema: UcSchema<number | bigint>,
): UccConfig<UcvNumericRange> {
  return {
    configure([constraint, than, or]) {
      let setter: UcrxSetter;
      let bound: string;

      if (schema.type === BigInt) {
        bound = `${than}n`;
        setter = UcrxCore.big;
      } else {
        bound = String(than);
        setter = UcrxCore.num;
      }

      const message = or != null ? `, ${esStringLiteral(or)}` : '';

      processor.modifyUcrxMethod(schema, setter, {
        before({ member: { args } }) {
          return ucvValidate(args, ({ value, reject }) => code => {
            const ucvReject = UC_MODULE_VALIDATOR.import(`ucvViolate${constraint}`);

            code
              .write(esline`if (${value} ${UcvNumericRange$reverseOp[constraint]} ${bound}) {`)
              .indent(reject(esline`${ucvReject}(${bound}${message})`))
              .write('}');
          });
        },
      });
    },
  };
}

const UcvNumericRange$reverseOp: { readonly [key in UcvNumericRange['0']]: string } = {
  ItsMin: '<',
  ItIsGreaterThan: '<=',
  ItsMax: '>',
  ItIsLessThan: '>=',
};
