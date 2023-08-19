import { EsSnippet, EsVarKind, EsVarSymbol, esEscapeString, esMemberAccessor, esline } from 'esgen';
import { UcMap } from '../../../../schema/map/uc-map.js';
import { ucModelName } from '../../../../schema/uc-model-name.js';
import { ucNullable } from '../../../../schema/uc-nullable.js';
import { ucOptional } from '../../../../schema/uc-optional.js';
import { UcModel, UcSchema } from '../../../../schema/uc-schema.js';
import { UnsupportedUcSchemaError } from '../../../common/unsupported-uc-schema.error.js';
import { UC_MODULE_SERIALIZER } from '../../../impl/uc-modules.js';
import { UcsFormatter, UcsFormatterContext, UcsFormatterSignature } from '../../ucs-formatter.js';
import { UcsLib } from '../../ucs-lib.js';
import { ucsCheckJSON, ucsFormatJSON, ucsWriteJSONNull } from './ucs-format-json.js';

export function ucsFormatJSONMap<
  TEntriesModel extends UcMap.EntriesModel,
  TExtraModel extends UcModel | false,
>(): UcsFormatter<UcMap.Infer<TEntriesModel, TExtraModel>> {
  return ucsFormatJSON(function ucsWriteJSONMap(
    { writer, value }: UcsFormatterSignature.AllValues,
    { entries }: UcMap.Schema<TEntriesModel, TExtraModel>,
    context: UcsFormatterContext,
  ): EsSnippet {
    return (code, scope) => {
      const lib = scope.get(UcsLib);

      const entryValue = new EsVarSymbol(`entryValue`);
      const entryIdx = new EsVarSymbol(`entryIdx`);
      let isFirst = true;
      let mayBeFirst = true;

      function writeEntry(entryKey: string, entrySchema: UcSchema): EsSnippet {
        let writeKey: EsSnippet;

        if (isFirst) {
          isFirst = false;

          const prefix = lib.binConst(`{${JSON.stringify(entryKey)}:`);

          writeKey = code => {
            code.write(
              esline`await ${writer}.ready;`,
              esline`${writer}.write(${prefix});`,
              esline`++${entryIdx};`,
            );
          };

          mayBeFirst = !!entrySchema.optional;
        } else {
          const prefix = lib.binConst(`,${JSON.stringify(entryKey)}:`);

          if (mayBeFirst) {
            const firstPrefix = lib.binConst(`{${JSON.stringify(entryKey)}:`);

            writeKey = code => {
              code
                .write(esline`await ${writer}.ready;`)
                .write(esline`${writer}.write(${entryIdx}++ ? ${prefix} : ${firstPrefix});`);
            };

            mayBeFirst = !!entrySchema.optional;
          } else {
            writeKey = code => {
              code.write(
                esline`await ${writer}.ready;`,
                esline`${writer}.write(${prefix});`,
                esline`++${entryIdx};`,
              );
            };
          }
        }

        return code => {
          if (entrySchema.optional) {
            if (entrySchema.nullable) {
              code
                .write(esline`if (${entryValue} != null) {`)
                .indent(writeKey, writeValue())
                .write(esline`} else if (${entryValue} === null) {`)
                .indent(writeKey, ucsWriteJSONNull(writer))
                .write('}');
            } else {
              code
                .write(esline`if (${entryValue} != null) {`)
                .indent(writeKey, writeValue())
                .write('}');
            }
          } else {
            code.write(writeKey, ucsCheckJSON({ writer, value }, entrySchema, writeValue()));
          }
        };

        function writeValue(): EsSnippet {
          return context.format(
            ucOptional(ucNullable(entrySchema, false), false),
            {
              writer,
              value: entryValue,
              asItem: '0',
            },
            (schema, context) => {
              throw new UnsupportedUcSchemaError(
                schema,
                `${context}: Can not serialize entry "${esEscapeString(
                  entryKey,
                )}" of type "${ucModelName(schema)}"`,
              );
            },
          );
        }
      }

      code.write(entryValue.declare(), entryIdx.declare({ as: EsVarKind.Let, value: () => '0' }));

      for (const [entryKey, entrySchema] of Object.entries<UcSchema>(entries)) {
        code.write(esline`${entryValue} = ${value}${esMemberAccessor(entryKey).accessor};`);
        code.write(writeEntry(entryKey, entrySchema));
      }

      // TODO serialize extra entries

      const closingBrace = UC_MODULE_SERIALIZER.import('UCS_CLOSING_BRACE');

      code.write(esline`await ${writer}.ready;`);
      if (mayBeFirst) {
        const emptyObject = UC_MODULE_SERIALIZER.import('UCS_JSON_EMPTY_OBJECT');

        code.write(esline`${writer}.write(${entryIdx} ? ${closingBrace} : ${emptyObject});`);
      } else {
        code.write(esline`${writer}.write(${closingBrace});`);
      }
    };
  });
}
