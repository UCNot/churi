import { EsCallable, EsSnippet, EsVarKind, EsVarSymbol, esMemberAccessor, esline } from 'esgen';
import { encodeURIPart } from 'httongue';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcMap } from '../../schema/map/uc-map.js';
import { ucOptional } from '../../schema/uc-optional.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCapability } from '../processor/ucc-capability.js';
import { UcsInsetContext, UcsInsetFormatter } from './ucs-inset-formatter.js';
import { UcsLib } from './ucs-lib.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportURIParams(activation: UccCapability.Activation<UcsSetup>): void {
  activation.onConstraint(
    {
      processor: 'serializer',
      use: 'ucsProcessMap',
      from: COMPILER_MODULE,
    },
    ({ setup }) => {
      setup
        .formatWith(
          'uriParams',
          'map',
          ({ writer, value }, schema: UcMap.Schema, cx) => (code, scope) => {
              const lib = scope.get(UcsLib);
              const { entries } = schema;
              const entriesWritten = new EsVarSymbol('entriesWritten');
              const currentKey = new EsVarSymbol('currentKey');
              const writeKey = new EsCallable({}).lambda(
                () => code => {
                  code
                    .write(esline`await ${writer}.ready;`)
                    .write(
                      esline`${writer}.write(${entriesWritten}++ ? ${currentKey} : ${currentKey}.slice(1));`,
                    );
                },
                {
                  async: true,
                },
              );

              code.write(
                entriesWritten.declare({ as: EsVarKind.Let, value: () => '0' }),
                currentKey.declare(),
                esline`${writer}.data.writeKey = ${writeKey};`,
              );

              for (const [entryKey, entrySchema] of Object.entries(entries)) {
                const keyConst = lib.binConst(`&${encodeURIPart(entryKey)}=`);
                const writeEntry =
                  (schema: UcSchema, value: EsSnippet): EsSnippet => code => {
                    code.write(
                      esline`${currentKey} = ${keyConst};`,
                      cx.formatInset('uriParam', schema, {
                        writer,
                        value,
                        asItem: '0',
                      }),
                    );
                  };

                if (entrySchema.optional) {
                  const currentValue = new EsVarSymbol(entryKey);

                  code
                    .write(
                      currentValue.declare({
                        value: () => esline`${value}${esMemberAccessor(entryKey).accessor}`,
                      }),
                    )
                    .write(esline`if (${currentValue} !== undefined) {`)
                    .indent(writeEntry(ucOptional(entrySchema, false), currentValue))
                    .write('}');
                } else {
                  code.write(
                    writeEntry(entrySchema, esline`${value}${esMemberAccessor(entryKey).accessor}`),
                  );
                }
              }
            },
        )
        .modifyInsets('uriParams', 'map', ucsModifyURIParam);
    },
  );
}

function ucsModifyURIParam<T, TSchema extends UcSchema<T>>({
  formatter,
}: UcsInsetContext<T, TSchema>): UcsInsetFormatter<T, TSchema> | undefined {
  if (!formatter) {
    return;
  }

  const { insetFormat, format } = formatter;

  return {
    insetFormat,
    format(args, schema, cx) {
      const { writer } = args;

      return code => {
        code.write(esline`await ${writer}.data.writeKey();`, format(args, schema, cx));
      };
    },
  };
}
