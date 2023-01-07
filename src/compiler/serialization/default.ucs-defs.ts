import { noop } from '@proc7ts/primitives';
import { encodeUcsString } from '../../impl/encode-ucs-string.js';
import { CHURI_MODULE, SERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcList } from '../../schema/uc-list.js';
import { UcMap } from '../../schema/uc-map.js';
import { ucNullable, ucOptional, UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UnsupportedUcSchema } from '../unsupported-uc-schema.js';
import { UcsDefs } from './ucs-defs.js';
import { UcsFunction } from './ucs-function.js';

class Default$UcsDefs implements UcsDefs {

  readonly #byType: {
    readonly [type: string]: UcsDefs['serialize'];
  };

  constructor() {
    this.#byType = {
      bigint: this.#writeBigInt.bind(this),
      boolean: this.#writeBoolean.bind(this),
      list: this.#writeList.bind(this),
      map: this.#writeMap.bind(this),
      number: this.#writeNumber.bind(this),
      string: this.#writeString.bind(this),
    };
  }

  get from(): string {
    return CHURI_MODULE;
  }

  serialize(serializer: UcsFunction, schema: UcSchema, value: string): UccCode.Source | undefined {
    const writer = this.#byType[schema.type];

    return writer?.(serializer, schema, value);
  }

  #writeBigInt(fn: UcsFunction, schema: UcSchema, value: string): UccCode.Source {
    const { lib, args } = fn;
    const writeBigInt = lib.import(SERIALIZER_MODULE, 'writeUcBigInt');

    return this.#checkConstraints(
      fn,
      schema,
      value,
      `await ${writeBigInt}(${args.writer}, ${value});`,
    );
  }

  #writeBoolean(fn: UcsFunction, schema: UcSchema, value: string): UccCode.Source {
    const { lib, args } = fn;
    const ucsTrue = lib.import(SERIALIZER_MODULE, 'UCS_TRUE');
    const ucsFalse = lib.import(SERIALIZER_MODULE, 'UCS_FALSE');

    return this.#checkConstraints(fn, schema, value, function writeBoolean(code: UccCode) {
      code.write(
        `await ${args.writer}.ready;`,
        `${args.writer}.write(${value} ? ${ucsTrue} : ${ucsFalse});`,
      );
    });
  }

  #writeNumber(fn: UcsFunction, schema: UcSchema, value: string): UccCode.Source {
    const { lib, args } = fn;
    const writeNumber = lib.import(SERIALIZER_MODULE, 'writeUcNumber');

    return this.#checkConstraints(
      fn,
      schema,
      value,
      `await ${writeNumber}(${args.writer}, ${value});`,
    );
  }

  #writeList<TItem, TItemSpec extends UcSchema.Spec<TItem>>(
    fn: UcsFunction,
    schema: UcList.Schema<TItem, TItemSpec>,
    value: string,
  ): UccCode.Source {
    const { lib, aliases, args } = fn;
    const openingParenthesis = lib.import(SERIALIZER_MODULE, 'UCS_OPENING_PARENTHESIS');
    const closingParenthesis = lib.import(SERIALIZER_MODULE, 'UCS_CLOSING_PARENTHESIS');
    const listItemSeparator = lib.import(SERIALIZER_MODULE, 'UCS_LIST_ITEM_SEPARATOR');
    const emptyList = lib.import(SERIALIZER_MODULE, 'UCS_EMPTY_LIST');
    const itemSchema = schema.item.optional
      ? ucOptional(ucNullable(schema.item), false) // Write `undefined` items as `null`
      : schema.item;
    const itemValue = aliases.aliasFor(`${value}$item`);
    const itemWritten = aliases.aliasFor(`${value}$itemWritten`);

    return this.#checkConstraints(fn, schema, value, code => {
      code
        .write(`let ${itemWritten} = false;`)
        .write(`for (const ${itemValue} of ${value}) {`)
        .indent(code => {
          code
            .write(`if (!${itemWritten}) {`)
            .indent(
              `await ${args.writer}.ready;`,
              `${args.writer}.write(${openingParenthesis});`,
              `${itemWritten} = true;`,
            )
            .write('} else {')
            .indent(`await ${args.writer}.ready;`, `${args.writer}.write(${listItemSeparator});`)
            .write('}');
          try {
            code.write(fn.serialize(itemSchema, itemValue));
          } catch (cause) {
            throw new UnsupportedUcSchema(
              itemSchema,
              `${fn.name}: Can not serialize list item of type "${itemSchema.type}" from "${itemSchema.from}"`,
              { cause },
            );
          }
        })
        .write(
          `}`,
          `await ${args.writer}.ready;`,
          `${args.writer}.write(${itemWritten} ? ${closingParenthesis} : ${emptyList});`,
        );
    });
  }

  #writeMap<TEntriesSpec extends UcMap.Schema.Entries.Spec>(
    fn: UcsFunction,
    schema: UcMap.Schema<TEntriesSpec>,
    value: string,
  ): UccCode.Source {
    const { lib, aliases, args } = fn;
    const textEncoder = lib.declarations.declareConst('TEXT_ENCODER', 'new TextEncoder()');
    const openingParenthesis = lib.import(SERIALIZER_MODULE, 'UCS_OPENING_PARENTHESIS');
    const closingParenthesis = lib.import(SERIALIZER_MODULE, 'UCS_CLOSING_PARENTHESIS');
    const emptyMap = lib.import(SERIALIZER_MODULE, 'UCS_EMPTY_MAP');
    const emptyEntryPrefix = lib.import(SERIALIZER_MODULE, 'UCS_EMPTY_ENTRY_PREFIX');
    const nullEntryValue = lib.import(SERIALIZER_MODULE, 'UCS_NULL_ENTRY_VALUE');
    const entryValue = aliases.aliasFor(`${value}$entryValue`);

    let startMap: UccCode.Builder = noop;
    const writeDefaultEntryPrefix = (key: string): UccCode.Source => {
      const entryPrefix = key
        ? lib.declarations.declareConst(key, `${textEncoder}.encode('${encodeUcsString(key)}(')`, {
            prefix: 'EP_',
          })
        : emptyEntryPrefix;

      return code => code.write(`await ${args.writer}.ready;`, `${args.writer}.write(${entryPrefix})`);
    };
    let writeEntryPrefix = writeDefaultEntryPrefix;

    if (this.#firstKeyMayBeEmpty(schema)) {
      const entryWritten = aliases.aliasFor(`${value}$entryWritten`);

      startMap = code => code.write(`let ${entryWritten} = false;`);
      writeEntryPrefix = key => {
        if (key) {
          return code => code.write(`${entryWritten} = true`, writeDefaultEntryPrefix(key));
        }

        return code => {
          code
            .write(`if (${entryWritten}) {`)
            .indent(writeDefaultEntryPrefix(key))
            .write(`} else {`)
            .indent(`${entryWritten} = true;`, `${args.writer}.write(${openingParenthesis});`)
            .write(`}`);
        };
      };
    }

    return this.#checkConstraints(fn, schema, value, code => {
      // Always prefix with `$`
      code.write(`await ${args.writer}.ready;`, `${args.writer}.write(${emptyMap});`);
      code.write(startMap);
      code.write(`let ${entryValue};`);

      for (const [key, entrySchema] of Object.entries<UcSchema>(schema.entries)) {
        code.write(
          `${entryValue} = ${value}${propertyAccessExpr(key)};`,
          this.#checkConstraints(
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
                throw new UnsupportedUcSchema(
                  entrySchema,
                  `${fn.name}: Can not serialize entry "${key}" of type "${entrySchema.type}"`
                    + ` from "${entrySchema.from}"`,
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
    });
  }

  #firstKeyMayBeEmpty<TEntriesSpec extends UcMap.Schema.Entries.Spec>(
    schema: UcMap.Schema<TEntriesSpec>,
  ): boolean {
    for (const [entryKey, entrySchema] of Object.entries<UcSchema>(schema.entries)) {
      if (!entryKey) {
        return true;
      }
      if (!entrySchema.optional) {
        break;
      }
    }

    return false;
  }

  #writeString(fn: UcsFunction, schema: UcSchema, value: string): UccCode.Source {
    const { lib, args } = fn;
    const writeString = lib.import(SERIALIZER_MODULE, 'writeUcString');

    return this.#checkConstraints(
      fn,
      schema,
      value,
      `await ${writeString}(${args.writer}, ${value});`,
    );
  }

  #checkConstraints(
    fn: UcsFunction,
    schema: UcSchema,
    value: string,
    onValue: UccCode.Source,
    {
      onNull,
    }: {
      readonly onNull?: UccCode.Source;
    } = {},
  ): UccCode.Builder {
    const { lib, args } = fn;
    const ucsNull = lib.import(SERIALIZER_MODULE, 'UCS_NULL');

    return function checkConstraints(code: UccCode) {
      if (schema.nullable) {
        code.write(`if (${value} != null) {`).indent(onValue);
        if (schema.optional) {
          code
            .write(`} else if (${value} === null) {`)
            .indent(
              onNull
                ?? (code => code.write(`await ${args.writer}.ready;`, `${args.writer}.write(${ucsNull})`)),
            );
        } else {
          code
            .write(`} else {`)
            .indent(
              onNull
                ?? (code => code.write(`await ${args.writer}.ready;`, `${args.writer}.write(${ucsNull})`)),
            );
        }
        code.write('}');
      } else if (schema.optional) {
        code.write(`if (${value} != null) {`).indent(onValue).write(`}`);
      } else {
        code.write(onValue);
      }
    };
  }

}

const ASCII_KEY_PATTERN = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
const KEY_ESCAPE_PATTERN = /'\//g;

function propertyAccessExpr(key: string): string {
  if (ASCII_KEY_PATTERN.test(key)) {
    return `.${key}`;
  }

  const escaped = key.replace(KEY_ESCAPE_PATTERN, char => `\\${char}`);

  return `['${escaped}']`;
}

export const DefaultUcsDefs: UcsDefs = /*#__PURE__*/ new Default$UcsDefs();
