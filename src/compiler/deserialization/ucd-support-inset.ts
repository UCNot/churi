import { esImport, esMemberAccessor, esline } from 'esgen';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UC_TOKEN_INSET_URI_PARAM } from '../../syntax/uc-token.js';
import { UcrxCore$stubBody } from '../impl/ucrx-core.stub.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxSetup } from '../rx/ucrx-setup.js';

export function ucdSupportInset(setup: UcrxSetup, schema: UcSchema): UccConfig<UcdInsetOptions> {
  return {
    configure({ lexer, from, method, args }) {
      const within = setup.currentPresentation;

      setup
        .modifyUcrxClass(schema, {
          applyTo(ucrxClass) {
            if (!ucrxClass.findMember(UcrxCore.ins)?.declared) {
              UcrxCore.ins.overrideIn(ucrxClass, {
                body: UcrxCore$stubBody,
              });
            }
          },
        })
        .modifyUcrxMethod(schema, UcrxCore.ins, {
          inset: {
            insetId: within && (UC_PRESENTATION_INSET_ID[within] ?? within),
            createLexer({
              member: {
                args: { emit },
              },
            }) {
              const UcLexer = esImport(from, lexer);
              const extraArgs = args?.length ? ', ' + args.join(', ') : '';

              return method
                ? esline`${UcLexer}${esMemberAccessor(method).accessor}(${emit}${extraArgs})`
                : esline`new ${UcLexer}(${emit}${extraArgs})`;
            },
          },
        });
    },
  };
}

export interface UcdInsetOptions {
  readonly lexer: string;
  readonly from: string;
  readonly method?: string | undefined;
  readonly args?: readonly string[] | undefined;
}

const UC_PRESENTATION_INSET_ID: {
  readonly [presentation in UcPresentationName]?: number | undefined;
} = {
  uriParam: UC_TOKEN_INSET_URI_PARAM,
};