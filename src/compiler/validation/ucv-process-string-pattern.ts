import { esStringLiteral, esline } from 'esgen';
import { ucvViolateItMatches } from '../../validator/ucv-string-pattern.violation.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { UC_MODULE_VALIDATOR } from '../impl/uc-modules.js';
import { UcrxBootstrap } from '../rx/ucrx-bootstrap.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { ucvValidate } from './ucv-validate.js';

export type UcvStringPattern = [match: RegExp, or?: string | undefined];

export function ucvProcessStringPattern(boot: UcrxBootstrap): UccConfig<UcvStringPattern> {
  return {
    configureSchema(schema, [match, or]) {
      boot.modifyUcrxMethod(schema, UcrxCore.str, {
        before({ member: { args } }) {
          return ucvValidate(args, ({ value, reject }) => code => {
            const pattern = String(match);
            const message = or != null ? `, ${esStringLiteral(or)}` : '';
            const ucvReject = UC_MODULE_VALIDATOR.import(ucvViolateItMatches.name);

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
