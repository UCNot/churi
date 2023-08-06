import { esStringLiteral, esline } from 'esgen';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UC_MODULE_VALIDATOR } from '../impl/uc-modules.js';
import { UcrxBootstrap } from '../rx/ucrx-bootstrap.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { ucvValidate } from './ucv-validate.js';

export type UcvStringLength = [
  constraint: 'ItHasMaxChars' | 'ItHasMinChars',
  than: number,
  or?: string | undefined,
];

export function ucvProcessStringLength(boot: UcrxBootstrap): UccFeature.Handle<UcvStringLength> {
  return {
    constrain({ schema, options: [constraint, than, or] }) {
      boot.modifyUcrxMethod(schema, UcrxCore.str, {
        before({ member: { args } }) {
          return ucvValidate(args, ({ value, reject }) => code => {
            const bound = String(than);
            const message = or != null ? `, ${esStringLiteral(or)}` : '';
            const ucvReject = UC_MODULE_VALIDATOR.import(`ucvViolate${constraint}`);

            code
              .write(
                esline`if (${value}.length ${UcvStringReject$reverseOp[constraint]} ${bound}) {`,
              )
              .indent(reject(esline`${ucvReject}(${bound}${message})`))
              .write('}');
          });
        },
      });
    },
  };
}

const UcvStringReject$reverseOp: { readonly [key in UcvStringLength['0']]: '>' | '<' } = {
  ItHasMinChars: '<',
  ItHasMaxChars: '>',
};
