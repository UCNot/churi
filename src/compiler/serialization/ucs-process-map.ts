import {
  EsCode,
  EsSnippet,
  EsVarKind,
  EsVarSymbol,
  esEscapeString,
  esMemberAccessor,
  esline,
} from 'esgen';
import { encodeUcsKey } from '../../impl/encode-ucs-string.js';
import { UcMap } from '../../schema/map/uc-map.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { ucNullable } from '../../schema/uc-nullable.js';
import { ucOptional } from '../../schema/uc-optional.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { ucsCheckCharge, ucsFormatCharge } from './impl/ucs-format-charge.js';
import { UcsBootstrap } from './ucs-bootstrap.js';
import { UcsFormatterContext, UcsFormatterSignature } from './ucs-formatter.js';
import { UcsLib } from './ucs-lib.js';

export function ucsProcessMap(boot: UcsBootstrap): UccFeature.Handle {
  boot.formatWith('charge', 'map', ucsFormatCharge(ucsWriteMap));

  return {
    constrain({ schema: { entries, extra } }: UccFeature.Constraint<void, UcMap.Schema>) {
      Object.values(entries).forEach(entrySchema => boot.processModel(entrySchema));
      // istanbul ignore next
      if (extra) {
        // TODO Implement extra entries serialization.
        boot.processModel(extra);
      }
    },
  };
}

function ucsWriteMap<TEntriesModel extends UcMap.EntriesModel>(
  { writer, value }: UcsFormatterSignature.AllValues,
  schema: UcMap.Schema<TEntriesModel>,
  context: UcsFormatterContext,
): EsSnippet {
  return (code, scope) => {
    const lib = scope.get(UcsLib);

    let startMap: EsSnippet = EsCode.none;
    let endMap: EsSnippet = EsCode.none;
    const writeDefaultEntryPrefix = (key: string): EsSnippet => {
      const entryPrefix = key
        ? lib.binConst(`${encodeUcsKey(key)}(`)
        : UC_MODULE_SERIALIZER.import('UCS_EMPTY_ENTRY_PREFIX');

      return code => {
        code.write(esline`await ${writer}.ready;`, esline`${writer}.write(${entryPrefix});`);
      };
    };
    let writeEntryPrefix = writeDefaultEntryPrefix;

    if (ucsMapMayBeEmpty(schema)) {
      const entryWritten = new EsVarSymbol(`entryWritten`);

      startMap = code => {
        code.line(entryWritten.declare({ as: EsVarKind.Let, value: () => 'false' }), ';');
      };
      endMap = code => {
        const emptyMap = UC_MODULE_SERIALIZER.import('UCS_EMPTY_MAP');

        code
          .write(esline`if (!${entryWritten}) {`)
          .indent(esline`await ${writer}.ready;`, esline`${writer}.write(${emptyMap});`)
          .write(`}`);
      };
      writeEntryPrefix = key => code => {
        code.write(esline`${entryWritten} = true;`, writeDefaultEntryPrefix(key));
      };
    }

    const entryValue = new EsVarSymbol(`entryValue`);

    code.write(
      entryValue.declare({
        as: EsVarKind.Let,
      }),
      startMap,
    );

    for (const [key, entrySchema] of Object.entries<UcSchema>(schema.entries)) {
      code.write(
        esline`${entryValue} = ${value}${esMemberAccessor(key).accessor};`,
        ucsCheckCharge(
          { writer, value: entryValue },
          entrySchema,
          code => {
            const closingParenthesis = UC_MODULE_SERIALIZER.import('UCS_CLOSING_PARENTHESIS');

            code
              .write(writeEntryPrefix(key))
              .write(
                context.format(
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
                        key,
                      )}" of type "${ucModelName(schema)}"`,
                    );
                  },
                ),
              )
              .write(
                esline`await ${writer}.ready;`,
                esline`${writer}.write(${closingParenthesis});`,
              );
          },
          {
            onNull: code => {
              const nullEntryValue = UC_MODULE_SERIALIZER.import('UCS_NULL_ENTRY_VALUE');

              code.write(writeEntryPrefix(key), esline`${writer}.write(${nullEntryValue});`);
            },
          },
        ),
      );
    }

    code.write(endMap);
  };
}

function ucsMapMayBeEmpty<TEntriesModel extends UcMap.EntriesModel>(
  schema: UcMap.Schema<TEntriesModel>,
): boolean {
  return Object.values<UcSchema>(schema.entries).some(({ optional }) => optional);
}
