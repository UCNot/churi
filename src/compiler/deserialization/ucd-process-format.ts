import { EsSnippet, esImport, esMemberAccessor, esline } from 'esgen';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UC_TOKEN_INSET_URI_PARAM } from '../../syntax/uc-token.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UcrxCore$stubBody } from '../rx/impl/ucrx-core.stub.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcdBootstrap } from './ucd-bootstrap.js';

export function ucdProcessFormat<TBoot extends UcdBootstrap>(
  boot: TBoot,
): UccFeature.Handle<UcdFormatOptions> {
  return {
    constrain({ entry, schema, within, options: { lexer, from, method, args } }) {
      const createLexer = ({ emit }: { emit: EsSnippet }): EsSnippet => {
        const Lexer = esImport(from, lexer);
        const extraArgs = args?.length ? ', ' + args.join(', ') : '';

        return method
          ? esline`${Lexer}${esMemberAccessor(method).accessor}(${emit}${extraArgs})`
          : esline`new ${Lexer}(${emit}${extraArgs})`;
      };

      if (entry) {
        if (!within) {
          boot.useLexer(entry, args => esline`return ${createLexer(args)};`);
        } else if (within === 'inset') {
          boot.useInsetLexer(entry, args => esline`return ${createLexer(args)};`);
        }

        return;
      }

      if (within) {
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
              insetId: UC_PRESENTATION_INSET_ID[within] ?? within,
              createLexer({ member: { args } }) {
                return createLexer(args);
              },
            },
          });
      }
    },
  };
}

export interface UcdFormatOptions {
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
