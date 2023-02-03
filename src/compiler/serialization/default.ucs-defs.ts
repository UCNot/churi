import { noop } from '@proc7ts/primitives';
import { encodeUcsKey } from '../../impl/encode-ucs-string.js';
import { SERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcList } from '../../schema/uc-list.js';
import { UcMap } from '../../schema/uc-map.js';
import { ucNullable, ucOptional, UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { uccPropertyAccessExpr, uccStringExprContent } from '../ucc-expr.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcsDef } from './ucs-def.js';
import { UcsFunction } from './ucs-function.js';

class Default$UcsDefs {

  readonly #list: UcsDef[];

  constructor() {
    this.#list = [
      { type: 'bigint', serialize: this.#writeBigInt.bind(this) },
      { type: 'boolean', serialize: this.#writeBoolean.bind(this) },
      { type: 'list', serialize: this.#writeList.bind(this) },
      { type: 'map', serialize: this.#writeMap.bind(this) },
      { type: 'number', serialize: this.#writeNumber.bind(this) },
      { type: 'string', serialize: this.#writeString.bind(this) },
    ];
  }

  get list(): readonly UcsDef[] {
    return this.#list;
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
    asItem: string,
  ): UccCode.Source {
    const { lib, aliases, args } = fn;
    const openingParenthesis = lib.import(SERIALIZER_MODULE, 'UCS_OPENING_PARENTHESIS');
    const closingParenthesis = lib.import(SERIALIZER_MODULE, 'UCS_CLOSING_PARENTHESIS');
    const emptyList = lib.import(SERIALIZER_MODULE, 'UCS_EMPTY_LIST');
    const comma = lib.import(SERIALIZER_MODULE, 'UCS_COMMA');
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
          code.write(
            `await ${args.writer}.ready;`,
            `${args.writer}.write(${itemWritten} || !${asItem} ? ${comma} : ${openingParenthesis});`,
            `${itemWritten} = true;`,
          );
          try {
            code.write(fn.serialize(itemSchema, itemValue, '1'));
          } catch (cause) {
            throw new UnsupportedUcSchemaError(
              itemSchema,
              `${fn.name}: Can not serialize list item of type "${itemSchema.type}"`,
              { cause },
            );
          }
        })
        .write(`}`)
        .write(`if (${asItem}) {`)
        .indent(
          `await ${args.writer}.ready;`,
          `${args.writer}.write(${itemWritten} ? ${closingParenthesis} : ${emptyList});`,
        )
        .write(`} else if (!${itemWritten}) {`)
        .indent(`await ${args.writer}.ready;`, `${args.writer}.write(${comma});`)
        .write(`}`);
    });
  }

  #writeMap<TEntriesSpec extends UcMap.Schema.Entries.Spec>(
    fn: UcsFunction,
    schema: UcMap.Schema<TEntriesSpec>,
    value: string,
  ): UccCode.Source {
    const { lib, aliases, args } = fn;
    const textEncoder = lib.declarations.declareConst('TEXT_ENCODER', 'new TextEncoder()');
    const closingParenthesis = lib.import(SERIALIZER_MODULE, 'UCS_CLOSING_PARENTHESIS');
    const emptyMap = lib.import(SERIALIZER_MODULE, 'UCS_EMPTY_MAP');
    const emptyEntryPrefix = lib.import(SERIALIZER_MODULE, 'UCS_EMPTY_ENTRY_PREFIX');
    const nullEntryValue = lib.import(SERIALIZER_MODULE, 'UCS_NULL_ENTRY_VALUE');
    const entryValue = aliases.aliasFor(`${value}$entryValue`);

    let startMap: UccCode.Builder = noop;
    let endMap: UccCode.Builder = noop;
    const writeDefaultEntryPrefix = (key: string): UccCode.Source => {
      const entryPrefix = key
        ? lib.declarations.declareConst(
            key,
            `${textEncoder}.encode('${uccStringExprContent(encodeUcsKey(key))}(')`,
            {
              prefix: 'EP_',
            },
          )
        : emptyEntryPrefix;

      return code => code.write(`await ${args.writer}.ready;`, `${args.writer}.write(${entryPrefix})`);
    };
    let writeEntryPrefix = writeDefaultEntryPrefix;

    if (this.#mayBeEmpty(schema)) {
      const entryWritten = aliases.aliasFor(`${value}$entryWritten`);

      startMap = code => code.write(`let ${entryWritten} = false;`);
      endMap = code => code
          .write(`if (!${entryWritten}) {`)
          .indent(`await ${args.writer}.ready; ${args.writer}.write(${emptyMap});`)
          .write(`}`);
      writeEntryPrefix = key => code => {
        code.write(`${entryWritten} = true;`, writeDefaultEntryPrefix(key));
      };
    }

    return this.#checkConstraints(fn, schema, value, code => {
      code.write(`let ${entryValue};`, startMap);

      for (const [key, entrySchema] of Object.entries<UcSchema>(schema.entries)) {
        code.write(
          `${entryValue} = ${uccPropertyAccessExpr(value, key)};`,
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
                throw new UnsupportedUcSchemaError(
                  entrySchema,
                  `${fn.name}: Can not serialize entry "${key}" of type "${entrySchema.type}"`,
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
    });
  }

  #mayBeEmpty<TEntriesSpec extends UcMap.Schema.Entries.Spec>(
    schema: UcMap.Schema<TEntriesSpec>,
  ): boolean {
    return Object.values<UcSchema>(schema.entries).some(({ optional }) => optional);
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

export const DefaultUcsDefs: readonly UcsDef[] = /*#__PURE__*/ new Default$UcsDefs().list;
