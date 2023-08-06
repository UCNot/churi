import {
  EsCallable,
  EsSnippet,
  EsVarKind,
  EsVarSymbol,
  esImport,
  esMemberAccessor,
  esline,
} from 'esgen';
import { encodeURISearchPart } from 'httongue';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcList } from '../../schema/list/uc-list.js';
import { UcMap } from '../../schema/map/uc-map.js';
import { ucOptional } from '../../schema/uc-optional.js';
import { UcFormatName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCapability } from '../bootstrap/ucc-capability.js';
import { UcsFormatter } from './ucs-formatter.js';
import { UcsInsetContext, UcsInsetFormatter } from './ucs-inset-formatter.js';
import { UcsLib } from './ucs-lib.js';
import { UcsSetup } from './ucs-setup.js';
import { UcsWriterClass } from './ucs-writer.class.js';

export function ucsSupportURIParams({
  defaultInsetFormat = 'charge',
}: UcsURIParamsOptions = {}): UccCapability<UcsSetup> {
  return activation => {
    activation.onConstraint(
      {
        processor: 'serializer',
        use: 'ucsProcessMap',
        from: COMPILER_MODULE,
      },
      ({ setup }) => {
        setup
          .writeWith('uriParams', ({ stream, options }) => async (code, { ns }) => {
            const encodeURI = esImport('httongue', encodeURISearchPart.name);
            const naming = await ns.refer(UcsWriterClass).whenNamed();

            code.line(
              naming.instantiate({
                stream,
                options: esline`{ ...${options}, encodeURI: ${encodeURI} }`,
              }),
            );
          })
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
                  const keyConst = lib.binConst(`&${encodeURISearchPart(entryKey)}=`);
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
                      writeEntry(
                        entrySchema,
                        esline`${value}${esMemberAccessor(entryKey).accessor}`,
                      ),
                    );
                  }
                }
              },
          )
          .modifyInsets('uriParams', 'map', modifyURIParam);
      },
    );
  };

  function modifyURIParam<T, TSchema extends UcSchema<T>>(
    context: UcsInsetContext<T, TSchema>,
  ): UcsInsetFormatter<T, TSchema> | undefined {
    const { lib, insetSchema, formatter } = context;
    let insetFormat: UcFormatName;
    let format: UcsFormatter<T, TSchema>;

    if (formatter) {
      ({ insetFormat, format } = formatter);
    } else {
      const defaultFormatter = lib.findFormatter<T, TSchema>(defaultInsetFormat, insetSchema);

      if (defaultFormatter) {
        insetFormat = defaultInsetFormat;
        format = defaultFormatter;
      } else if (insetSchema.type === 'list') {
        return modifyURIParamList(context);
      } else {
        return;
      }
    }

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

  function modifyURIParamList<T, TSchema extends UcSchema<T>>({
    lib,
  }: UcsInsetContext<T, TSchema>): UcsInsetFormatter<T, TSchema> | undefined;

  function modifyURIParamList({
    lib,
    hostFormat,
    hostSchema,
    insetName,
    insetSchema,
  }: UcsInsetContext<unknown[], UcList.Schema>):
    | UcsInsetFormatter<unknown[], UcList.Schema>
    | undefined {
    const itemFormatter = lib.findInsetFormatter({
      hostFormat,
      hostSchema,
      insetName,
      insetSchema: insetSchema.item,
    });

    if (!itemFormatter) {
      return;
    }

    const { insetFormat, format } = itemFormatter;

    return {
      insetFormat,
      format({ writer, value }, schema, context) {
        return (code, { ns: { names } }) => {
          const item = names.reserveName('item');

          code
            .write(esline`for (const ${item} of ${value}) {`)
            .indent(code => {
              code.write(format({ writer, value: item, asItem: '0' }, schema.item, context));
            })
            .write('}');
        };
      },
    };
  }
}

export interface UcsURIParamsOptions {
  readonly defaultInsetFormat?: UcFormatName | undefined;
}
