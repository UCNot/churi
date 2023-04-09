import { noop } from '@proc7ts/primitives';
import { encodeUcsKey } from '../../impl/encode-ucs-string.js';
import { SERIALIZER_MODULE } from '../../impl/module-names.js';
import { escapeJsString } from '../../impl/quote-property-key.js';
import { UcList } from '../../schema/list/uc-list.js';
import { UcMap } from '../../schema/map/uc-map.js';
import { ucNullable } from '../../schema/uc-nullable.js';
import { ucOptional } from '../../schema/uc-optional.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccBuilder, UccCode, UccSource } from '../codegen/ucc-code.js';
import { uccPropertyAccessExpr } from '../codegen/ucc-expr.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcsDef } from './ucs-def.js';
import { UcsFunction } from './ucs-function.js';

class Default$UcsDefs {

  readonly #list: UcsDef[];

  constructor() {
    this.#list = [
      { type: BigInt, serialize: this.#writeBigInt.bind(this) },
      { type: Boolean, serialize: this.#writeBoolean.bind(this) },
      { type: 'list', serialize: this.#writeList.bind(this) },
      { type: 'map', serialize: this.#writeMap.bind(this) },
      { type: Number, serialize: this.#writeNumber.bind(this) },
      { type: String, serialize: this.#writeString.bind(this) },
    ];
  }

  get list(): readonly UcsDef[] {
    return this.#list;
  }

  #writeBigInt(fn: UcsFunction, schema: UcSchema, value: string): UccSource {
    const { lib, args } = fn;
    const writeBigInt = lib.import(SERIALIZER_MODULE, 'writeUcBigInt');

    return this.#checkConstraints(
      fn,
      schema,
      value,
      `await ${writeBigInt}(${args.writer}, ${value});`,
    );
  }

  #writeBoolean(fn: UcsFunction, schema: UcSchema, value: string): UccSource {
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

  #writeNumber(fn: UcsFunction, schema: UcSchema, value: string): UccSource {
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
  ): UccSource {
    const { lib, ns, args } = fn;
    const openingParenthesis = lib.import(SERIALIZER_MODULE, 'UCS_OPENING_PARENTHESIS');
    const closingParenthesis = lib.import(SERIALIZER_MODULE, 'UCS_CLOSING_PARENTHESIS');
    const emptyList = lib.import(SERIALIZER_MODULE, 'UCS_EMPTY_LIST');
    const comma = lib.import(SERIALIZER_MODULE, 'UCS_COMMA');
    const itemSchema = schema.item.optional
      ? ucOptional(ucNullable(schema.item), false) // Write `undefined` items as `null`
      : schema.item;
    const itemValue = ns.name(`${value}$item`);
    const itemWritten = ns.name(`${value}$itemWritten`);

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
              `${fn.name}: Can not serialize list item of type "${ucSchemaName(itemSchema)}"`,
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
              deps: [textEncoder],
            },
          )
        : emptyEntryPrefix;

      return code => {
        code.write(`await ${args.writer}.ready;`, `${args.writer}.write(${entryPrefix})`);
      };
    };
    let writeEntryPrefix = writeDefaultEntryPrefix;

    if (this.#mayBeEmpty(schema)) {
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
                  `${fn.name}: Can not serialize entry "${escapeJsString(
                    key,
                  )}" of type "${ucSchemaName(entrySchema)}"`,
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

  #writeString(fn: UcsFunction, schema: UcSchema, value: string): UccSource {
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
    onValue: UccSource,
    {
      onNull,
    }: {
      readonly onNull?: UccSource;
    } = {},
  ): UccBuilder {
    const { lib, args } = fn;
    const ucsNull = lib.import(SERIALIZER_MODULE, 'UCS_NULL');

    return function checkConstraints(code: UccCode) {
      if (schema.nullable) {
        code.write(`if (${value} != null) {`).indent(onValue);
        if (schema.optional) {
          code.write(`} else if (${value} === null) {`).indent(
            onNull
              ?? (code => {
                code.write(`await ${args.writer}.ready;`, `${args.writer}.write(${ucsNull})`);
              }),
          );
        } else {
          code.write(`} else {`).indent(
            onNull
              ?? (code => {
                code.write(`await ${args.writer}.ready;`, `${args.writer}.write(${ucsNull})`);
              }),
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
