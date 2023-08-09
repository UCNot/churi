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
import { UcFormatName, UcPresentationName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcURIParamsOptions } from '../../syntax/formats/uri-params/uc-format-uri-params.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UccSchemaMap } from '../bootstrap/ucc-schema-map.js';
import { UcsBootstrap } from './ucs-bootstrap.js';
import { UcsFormatter } from './ucs-formatter.js';
import { UcsInsetContext, UcsInsetFormatter } from './ucs-inset-formatter.js';
import { UcsLib } from './ucs-lib.js';
import { UcsWriterClass } from './ucs-writer.class.js';

export function ucsProcessURIParams(
  boot: UcsBootstrap,
): UccFeature.Handle<UcURIParamsOptions | void> {
  const schemaOptions = new UccSchemaMap<UcURIParamsOptions | void>(boot.schemaIndex);

  function getSchemaOptions(
    schema: UcSchema,
    within: UcPresentationName | undefined,
  ): { [key in keyof UcURIParamsOptions]-?: Exclude<UcURIParamsOptions[key], undefined> } {
    const options = schemaOptions.get(schema, within);

    return {
      paramFormat: options?.paramFormat ?? 'charge',
      splitter: options?.splitter ?? '&',
    };
  }

  boot.onConstraint(
    {
      processor: 'serializer',
      use: 'ucsProcessMap',
      from: COMPILER_MODULE,
    },
    ({ within = 'uriParams' }) => {
      boot
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
              const { splitter } = getSchemaOptions(schema, within);
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
                const keyConst = lib.binConst(`${splitter}${encodeURISearchPart(entryKey)}=`);
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
        .modifyInsets('uriParams', 'map', modifyURIParam);
    },
  );

  return {
    constrain({ schema, within, options }) {
      boot.formatWith('uriParams', schema);
      schemaOptions.set(schema, options, within);
    },
  };

  function modifyURIParam<T, TSchema extends UcSchema<T>>(
    context: UcsInsetContext<T, TSchema>,
  ): UcsInsetFormatter<T, TSchema> | undefined {
    const { lib, hostFormat, hostSchema, insetSchema, formatter } = context;
    let insetFormat: UcFormatName;
    let format: UcsFormatter<T, TSchema>;

    if (formatter) {
      ({ insetFormat, format } = formatter);
    } else {
      const { paramFormat } = getSchemaOptions(hostSchema, hostFormat);
      const paramFormatter = lib.findFormatter<T, TSchema>(paramFormat, insetSchema);

      if (paramFormatter) {
        insetFormat = paramFormat;
        format = paramFormatter;
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
