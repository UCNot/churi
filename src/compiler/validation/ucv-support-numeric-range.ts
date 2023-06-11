import { esStringLiteral, esline } from 'esgen';
import { capitalize } from 'httongue';
import { UcvNumericRange } from '../../schema/numeric/uc-numeric-range.impl.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UC_MODULE_VALIDATOR } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxProcessor } from '../rx/ucrx-processor.js';
import { UcrxSetter } from '../rx/ucrx-setter.js';

export function ucvSupportNumericRange(
  processor: UcrxProcessor.Any,
  schema: UcSchema<number | bigint>,
): UccConfig<UcvNumericRange> {
  return {
    configure({ type, bound, message }) {
      let setter: UcrxSetter;
      let compareWith: string;

      if (schema.type === BigInt) {
        compareWith = `${bound}n`;
        setter = UcrxCore.big;
      } else {
        compareWith = String(bound);
        setter = UcrxCore.num;
      }

      const messageArg = message != null ? `, ${esStringLiteral(message)}` : '';

      processor.modifyUcrxMethod(schema, setter, {
        before({
          member: {
            args: { value, reject },
          },
        }) {
          return code => {
            const ucvReject = UC_MODULE_VALIDATOR.import(`ucvReject${capitalize(type)}`);

            code
              .write(esline`if (${value} ${UcvNumericRange$reverseSign[type]} ${compareWith}) {`)
              .indent(esline`return ${reject}(${ucvReject}(${compareWith}, ${messageArg}));`)
              .write('}');
          };
        },
      });
    },
  };
}

const UcvNumericRange$reverseSign: { readonly [key in UcvNumericRange['type']]: string } = {
  min: '<',
  greaterThan: '<=',
  max: '>',
  lessThan: '>=',
};
