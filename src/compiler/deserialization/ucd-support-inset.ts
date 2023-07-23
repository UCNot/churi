import { esImport, esline } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcrxCore$stubBody } from '../impl/ucrx-core.stub.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcdCompiler } from './ucd-compiler.js';

export function ucdSupportInset(
  compiler: UcdCompiler.Any,
  schema: UcSchema,
): UccConfig<UcdInsetOptions> {
  return {
    configure({ lexer, from, args }, { within: presentation }) {
      compiler
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
            presentation,
            createLexer({
              member: {
                args: { emit },
              },
            }) {
              const UcLexer = esImport(from, lexer);
              const extraArgs = args?.length ? ', ' + args.join(', ') : '';

              return esline`new ${UcLexer}(${emit}${extraArgs})`;
            },
          },
        });
    },
  };
}

export interface UcdInsetOptions {
  readonly lexer: string;
  readonly from: string;
  readonly args?: readonly string[] | undefined;
}
