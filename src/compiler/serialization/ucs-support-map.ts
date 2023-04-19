import { noop } from '@proc7ts/primitives';
import { encodeUcsKey } from '../../impl/encode-ucs-string.js';
import { SERIALIZER_MODULE } from '../../impl/module-names.js';
import { escapeJsString } from '../../impl/quote-property-key.js';
import { UcMap } from '../../schema/map/uc-map.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { ucNullable } from '../../schema/uc-nullable.js';
import { ucOptional } from '../../schema/uc-optional.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccBuilder, UccSource } from '../codegen/ucc-code.js';
import { uccPropertyAccessExpr } from '../codegen/ucc-expr.js';
import { ucsCheckConstraints } from '../impl/ucs-check-constraints.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcsFunction } from './ucs-function.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportMap(setup: UcsSetup, schema: UcMap.Schema): void;
export function ucsSupportMap(setup: UcsSetup, { entries, extra }: UcMap.Schema): void {
  setup.useUcsGenerator('map', ucsWriteMap);
  Object.values(entries).forEach(entrySchema => setup.processModel(entrySchema));
  // istanbul ignore next
  if (extra) {
    // TODO Implement extra entries serialization.
    setup.processModel(extra);
  }
}

function ucsWriteMap<TEntriesModel extends UcMap.Schema.Entries.Model>(
  fn: UcsFunction,
  schema: UcMap.Schema<TEntriesModel>,
  value: string,
): UccSource {
  const { lib, ns, args } = fn;
  const textEncoder = lib.declarations.declareConst('TEXT_ENCODER', 'new TextEncoder()');
  const closingParenthesis = lib.import(SERIALIZER_MODULE, 'UCS_CLOSING_PARENTHESIS');
  const emptyMap = lib.import(SERIALIZER_MODULE, 'UCS_EMPTY_MAP');
  const emptyEntryPrefix = lib.import(SERIALIZER_MODULE, 'UCS_EMPTY_ENTRY_PREFIX');
  const nullEntryValue = lib.import(SERIALIZER_MODULE, 'UCS_NULL_ENTRY_VALUE');
  const entryValue = ns.name(`${value}$entryValue`);

  let startMap: UccBuilder = noop;
  let endMap: UccBuilder = noop;
  const writeDefaultEntryPrefix = (key: string): UccSource => {
    const entryPrefix = key
      ? lib.declarations.declareConst(
          key,
          `${textEncoder}.encode('${escapeJsString(encodeUcsKey(key))}(')`,
          {
            prefix: 'EP_',
            refs: [textEncoder],
          },
        )
      : emptyEntryPrefix;

    return code => {
      code.write(`await ${args.writer}.ready;`, `${args.writer}.write(${entryPrefix})`);
    };
  };
  let writeEntryPrefix = writeDefaultEntryPrefix;

  if (ucsMapMayBeEmpty(schema)) {
    const entryWritten = ns.name(`${value}$entryWritten`);

    startMap = code => {
      code.write(`let ${entryWritten} = false;`);
    };
    endMap = code => {
      code
        .write(`if (!${entryWritten}) {`)
        .indent(`await ${args.writer}.ready; ${args.writer}.write(${emptyMap});`)
        .write(`}`);
    };
    writeEntryPrefix = key => code => {
      code.write(`${entryWritten} = true;`, writeDefaultEntryPrefix(key));
    };
  }

  return code => {
    code.write(`let ${entryValue};`, startMap);

    for (const [key, entrySchema] of Object.entries<UcSchema>(schema.entries)) {
      code.write(
        `${entryValue} = ${uccPropertyAccessExpr(value, key)};`,
        ucsCheckConstraints(
          fn,
          entrySchema,
          entryValue,
          code => {
            code.write(writeEntryPrefix(key));
            try {
              code.write(
                fn.serialize(ucOptional(ucNullable(entrySchema, false), false), entryValue),
              );
            } catch (cause) {
              throw new UnsupportedUcSchemaError(
                entrySchema,
                `${fn.name}: Can not serialize entry "${escapeJsString(
                  key,
                )}" of type "${ucModelName(entrySchema)}"`,
                { cause },
              );
            }
            code.write(
              `await ${args.writer}.ready;`,
              `${args.writer}.write(${closingParenthesis});`,
            );
          },
          {
            onNull: code => {
              code.write(writeEntryPrefix(key), `${args.writer}.write(${nullEntryValue})`);
            },
          },
        ),
      );
    }

    code.write(endMap);
  };
}

function ucsMapMayBeEmpty<TEntriesModel extends UcMap.Schema.Entries.Model>(
  schema: UcMap.Schema<TEntriesModel>,
): boolean {
  return Object.values<UcSchema>(schema.entries).some(({ optional }) => optional);
}
