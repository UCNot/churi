import { EsSnippet, EsVarSymbol, esEscapeString, esMemberAccessor, esline } from 'esgen';
import { UcMap } from '../../schema/map/uc-map.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { ucNullable } from '../../schema/uc-nullable.js';
import { ucOptional } from '../../schema/uc-optional.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { ucsEncodeKey } from '../../serializer/ucs-encode-key.js';
import { ucsWriteAsIs } from '../../serializer/ucs-write-asis.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UcsEntryIdx } from './impl/ucs-entry-idx.js';
import { ucsCheckCharge, ucsFormatCharge, ucsWriteNull } from './impl/ucs-format-charge.js';
import { ucsMapKeys } from './impl/ucs-map-keys.js';
import { UcsBootstrap } from './ucs-bootstrap.js';
import { UcsFormatterContext, UcsFormatterSignature } from './ucs-formatter.js';
import { UcsLib } from './ucs-lib.js';

export function ucsProcessMap(boot: UcsBootstrap): UccFeature.Handle {
  boot.formatWith('charge', 'map', ucsFormatCharge(ucsWriteMap));

  return {
    inspect({ entries, extra }: UcMap.Schema) {
      Object.values(entries).forEach(entrySchema => boot.processModel(entrySchema));
      if (extra) {
        boot.processModel(extra);
      }
    },
    constrain(_constraint) {},
  };
}

function ucsWriteMap<TEntriesModel extends UcMap.EntriesModel, TExtraModel extends UcModel | false>(
  { writer, value }: UcsFormatterSignature.AllValues,
  schema: UcMap.Schema<TEntriesModel, TExtraModel>,
  context: UcsFormatterContext,
): EsSnippet {
  const { entries, extra } = schema;

  return (code, scope) => {
    const lib = scope.get(UcsLib);
    let isFirst = true;
    let mayBeFirst = true;
    const entryIdx = new UcsEntryIdx();
    const entryList = Object.entries<UcSchema>(entries);

    code.write(entryIdx.declare());

    if (entryList.length) {
      const entryValue = new EsVarSymbol('entryValue');

      code.write(entryValue.let());

      const writeEntry = (entryKey: string, entrySchema: UcSchema): EsSnippet => {
        let writePrefix: EsSnippet;

        if (isFirst) {
          const firstPrefix = entryKey
            ? lib.binConst(`${ucsEncodeKey(entryKey)}(`)
            : UC_MODULE_SERIALIZER.import('UCS_EMPTY_ENTRY_PREFIX');

          isFirst = false;
          mayBeFirst = !!entrySchema.optional;

          const increment = entryIdx.requireIf(mayBeFirst).increment();

          writePrefix = code => {
            code.write(
              esline`await ${writer}.ready;`,
              esline`${writer}.write(${firstPrefix});`,
              increment,
            );
          };
        } else {
          const prefix = entryKey
            ? lib.binConst(`)${ucsEncodeKey(entryKey)}(`)
            : UC_MODULE_SERIALIZER.import('UCS_EMPTY_NEXT_ENTRY_PREFIX');

          if (mayBeFirst) {
            const firstPrefix = entryKey
              ? lib.binConst(`${ucsEncodeKey(entryKey)}(`)
              : UC_MODULE_SERIALIZER.import('UCS_EMPTY_ENTRY_PREFIX');
            const postIncrement = entryIdx.postIncrement();

            writePrefix = code => {
              code.write(
                esline`await ${writer}.ready;`,
                esline`${writer}.write(${postIncrement} ? ${prefix} : ${firstPrefix});`,
              );
            };

            mayBeFirst = !!entrySchema.optional;
          } else {
            const increment = entryIdx.increment();

            writePrefix = code => {
              code.write(
                esline`await ${writer}.ready;`,
                esline`${writer}.write(${prefix});`,
                increment,
              );
            };
          }
        }

        const writeValue = context.format(
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

        return code => {
          code.write(
            ucsCheckCharge(
              {
                writer,
                value: entryValue,
              },
              entrySchema,
              code => {
                code.write(writePrefix, writeValue);
              },
              {
                onNull: code => {
                  code.write(writePrefix, ucsWriteNull(writer));
                },
              },
            ),
          );
        };
      };

      for (const [entryKey, entrySchema] of entryList) {
        code.write(
          esline`${entryValue} = ${value}${esMemberAccessor(entryKey).accessor};`,
          writeEntry(entryKey, entrySchema),
        );
      }
    }

    if (extra) {
      const names = scope.ns.names.nest();
      const extraKey = names.reserveName('extraKey');
      const extraValue = names.reserveName('extraValue');
      const keys = ucsMapKeys(lib, schema);

      const writeExtra = (): EsSnippet => {
        let writePrefix: EsSnippet;
        const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);
        const encodeKey = UC_MODULE_SERIALIZER.import(ucsEncodeKey.name);

        if (mayBeFirst) {
          const postIncrement = entryIdx.postIncrement();

          writePrefix = code => {
            code.line(
              `await `,
              writeAsIs,
              '(',
              writer,
              ', ',
              postIncrement,
              ' ? `)${',
              encodeKey,
              '(',
              extraKey,
              ')}(` : `${',
              encodeKey,
              '(',
              extraKey,
              ')}(`);',
            );
          };
        } else {
          writePrefix = esline`await ${writeAsIs}(${writer}, \`)\${${encodeKey}(${extraKey})}(\`);`;
        }

        const writeValue = context.format(
          extra,
          {
            writer,
            value: extraValue,
            asItem: '0',
          },
          (schema, context) => {
            throw new UnsupportedUcSchemaError(
              schema,
              `${context}: Can not serialize extra entry of type "${ucModelName(schema)}"`,
            );
          },
        );

        return code => {
          code.write(
            ucsCheckCharge(
              {
                writer,
                value: extraValue,
              },
              extra,
              code => {
                code.write(writePrefix, writeValue);
              },
              {
                onNull: code => {
                  code.write(writePrefix, ucsWriteNull(writer));
                },
              },
            ),
          );
        };
      };

      code
        .write(esline`for (const [${extraKey}, ${extraValue}] of Object.entries(${value})) {`)
        .indent(code => {
          if (keys) {
            // Explicit keys specified. Filter them out.
            code
              .write(esline`if (!(${extraKey} in ${keys})) {`)
              .indent(writeExtra())
              .write('}');
          } else {
            // No explicit keys. No need to check.
            code.write(writeExtra());
          }
        })
        .write('}');
    }

    const closingParenthesis = UC_MODULE_SERIALIZER.import('UCS_CLOSING_PARENTHESIS');

    code.write(esline`await ${writer}.ready;`);
    if (mayBeFirst) {
      const emptyMap = UC_MODULE_SERIALIZER.import('UCS_EMPTY_MAP');
      const hasEntries = entryIdx.get();

      code.write(esline`${writer}.write(${hasEntries} ? ${closingParenthesis} : ${emptyMap});`);
    } else {
      code.write(esline`${writer}.write(${closingParenthesis});`);
    }
  };
}
