import { esImport, esline } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcdCompiler } from './ucd-compiler.js';

export function ucdSupportInset(
  compiler: UcdCompiler.Any,
  schema: UcSchema,
): UccConfig<UcdInsetOptions> {
  return {
    configure({ lexer, from, args }) {
      compiler.modifyUcrxClass(schema, {
        applyTo(ucrxClass) {
          UcrxCore.ins.overrideIn(ucrxClass, {
            body({
              member: {
                args: { emit },
              },
            }) {
              const UcLexer = esImport(from, lexer);
              // istanbul ignore next
              const extraArgs = args?.length ? ', ' + args.join(', ') : '';

              return esline`return new ${UcLexer}(${emit}${extraArgs});`;
            },
          });
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
