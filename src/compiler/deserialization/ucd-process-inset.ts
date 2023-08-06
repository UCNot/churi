import { esImport, esMemberAccessor, esline } from 'esgen';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UC_TOKEN_INSET_URI_PARAM } from '../../syntax/uc-token.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { UcrxCore$stubBody } from '../rx/impl/ucrx-core.stub.js';
import { UcrxBootstrap } from '../rx/ucrx-bootstrap.js';
import { UcrxCore } from '../rx/ucrx-core.js';

export function ucdProcessInset(boot: UcrxBootstrap): UccConfig<UcdInsetOptions> {
  return {
    configureSchema(schema, { lexer, from, method, args }) {
      const within = boot.currentPresentation;

      boot
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
