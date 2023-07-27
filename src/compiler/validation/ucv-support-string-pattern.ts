import { esStringLiteral, esline } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';
import { UC_MODULE_VALIDATOR } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxSetup } from '../rx/ucrx-setup.js';
import { ucvValidate } from './ucv-validate.js';

export type UcvStringPattern = [match: RegExp, or?: string | undefined];

export function ucvSupportStringPattern(
  setup: UcrxSetup,
  schema: UcSchema<string>,
): UccConfig<UcvStringPattern> {
  return {
    configure([match, or]) {
      setup.modifyUcrxMethod(schema, UcrxCore.str, {
        before({ member: { args } }) {
          return ucvValidate(args, ({ value, reject }) => code => {
            const pattern = String(match);
            const message = or != null ? `, ${esStringLiteral(or)}` : '';
            const ucvReject = UC_MODULE_VALIDATOR.import(`ucvViolateItMatches`);

            code
              .write(esline`if (!${pattern}.test(${value})) {`)
              .indent(reject(esline`${ucvReject}(${pattern}${message})`))
              .write('}');
          });
        },
      });
    },
  };
}
