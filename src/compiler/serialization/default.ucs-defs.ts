import { encodeUcsKey } from '../../impl/encode-ucs-key.js';
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
    readonly [type: string]: {
      serialize(
        serializer: UcsFunction,
        schema: UcSchema,
        code: UccCode,
        value: string,
      ): void | Promise<void>;
    }['serialize'];
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

  serialize(serializer: UcsFunction, schema: UcSchema): UcsDefs.Serializer | undefined {
    const writer = this.#byType[schema.type];

    return (
      writer
      && (async (code: UccCode, value: string) => await writer(serializer, schema, code, value))
    );
  }

  #writeBigInt(fn: UcsFunction, schema: UcSchema, code: UccCode, value: string): void {
    this.#writeWith(fn, schema, code, 'writeUcBigInt', value);
  }

  #writeBoolean(fn: UcsFunction, schema: UcSchema, code: UccCode, value: string): void {
    const { lib, args } = fn;
    const ucsTrue = lib.import(SERIALIZER_MODULE, 'UCS_TRUE');
    const ucsFalse = lib.import(SERIALIZER_MODULE, 'UCS_FALSE');

    code.write(
      this.#checkConstraints(fn, schema, value, code => {
        code.write(
          `await ${args.writer}.ready;`,
          `${args.writer}.write(${value} ? ${ucsTrue} : ${ucsFalse});`,
        );
      }),
    );
  }

  #writeNumber(fn: UcsFunction, schema: UcSchema, code: UccCode, value: string): void {
    this.#writeWith(fn, schema, code, 'writeUcNumber', value);
  }

  #writeList<TItem, TItemSpec extends UcSchema.Spec<TItem>>(
    fn: UcsFunction,
    schema: UcList.Schema<TItem, TItemSpec>,
    code: UccCode,
    value: string,
  ): void {
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

    code.write(
      this.#checkConstraints(fn, schema, value, code => {
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
              const serializer = fn.serializerFor(itemSchema);

              code.write(async code => await serializer(code, itemValue));
            } catch (cause) {
              throw new UnsupportedUcSchema(
                itemSchema,
                `Can not serialize list item of type "${itemSchema.type}" from "${itemSchema.from}"`,
                { cause },
              );
            }
          })
          .write(`}`);
        code.write(
          `await ${args.writer}.ready;`,
          `${args.writer}.write(${itemWritten} ? ${closingParenthesis} : ${emptyList});`,
        );
      }),
    );
  }

  #writeMap<TEntriesSpec extends UcMap.Schema.Entries.Spec>(
    fn: UcsFunction,
    schema: UcMap.Schema<TEntriesSpec>,
    code: UccCode,
    value: string,
  ): void {
    const { lib, aliases, args } = fn;
    const textEncoder = lib.declarations.declareConst('TEXT_ENCODER', 'new TextEncoder()');
    const closingParenthesis = lib.import(SERIALIZER_MODULE, 'UCS_CLOSING_PARENTHESIS');
    const emptyMap = lib.import(SERIALIZER_MODULE, 'UCS_EMPTY_MAP');
    const nullEntryValue = lib.import(SERIALIZER_MODULE, 'UCS_NULL_ENTRY_VALUE');
    const entryWritten = aliases.aliasFor(`${value}$entryWritten`);
    const entryValue = aliases.aliasFor(`${value}$entryValue`);

    code.write(
      this.#checkConstraints(fn, schema, value, code => {
        code.write(`let ${entryWritten} = false;`);
        code.write(`let ${entryValue};`);

        for (const [key, entrySchema] of Object.entries<UcSchema>(schema.entries)) {
          const entryPrefix = lib.declarations.declareConst(
            key,
            `${textEncoder}.encode('${encodeUcsKey(key)}(')`,
            {
              prefix: 'KEY_',
            },
          );

          code.write(
            `${entryValue} = ${value}${propertyAccessExpr(key)};`,
            this.#checkConstraints(
              fn,
              entrySchema,
              entryValue,
              code => {
                code.write(`await ${args.writer}.ready;`, `${args.writer}.write(${entryPrefix})`);
                try {
                  const serializer = fn.serializerFor(
                    ucOptional(ucNullable(entrySchema, false), false),
                  );

                  code.write(async code => await serializer(code, entryValue));
                } catch (cause) {
                  throw new UnsupportedUcSchema(
                    entrySchema,
                    `Can not serialize entry "${key}" of type "${entrySchema.type}" from "${entrySchema.from}"`,
                    { cause },
                  );
                }
                code.write(
                  `await ${args.writer}.ready;`,
                  `${args.writer}.write(${closingParenthesis});`,
                  `${entryWritten} = true;`,
                );
              },
              code => {
                code.write(
                  `await ${args.writer}.ready;`,
                  `${args.writer}.write(${entryPrefix})`,
                  `${args.writer}.write(${nullEntryValue})`,
                  `${entryWritten} = true;`,
                );
              },
            ),
          );
        }

        code
          .write(`if (!${entryWritten}) {`)
          .indent(`await ${args.writer}.ready;`, `${args.writer}.write(${emptyMap});`)
          .write('}');
      }),
    );
  }

  #writeString(fn: UcsFunction, schema: UcSchema, code: UccCode, value: string): void {
    this.#writeWith(fn, schema, code, 'writeUcString', value);
  }

  #checkConstraints(
    fn: UcsFunction,
    schema: UcSchema,
    value: string,
    build: (code: UccCode) => void,
    buildNull?: (code: UccCode) => void,
    buildUndefined?: (code: UccCode) => void,
  ): UccCode.Builder {
    const { lib, args } = fn;
    const ucsNull = lib.import(SERIALIZER_MODULE, 'UCS_NULL');

    return code => {
      if (schema.nullable) {
        code.write(`if (${value} != null) {`).indent(build);
        if (schema.optional) {
          code
            .write(`} else if (${value} === null) {`)
            .indent(buildNull ?? `await ${args.writer}.ready;`, `${args.writer}.write(${ucsNull})`);
          if (buildUndefined) {
            code.write(`} else {`).indent(buildUndefined);
          }
        } else {
          code
            .write(`} else {`)
            .indent(buildNull ?? `await ${args.writer}.ready;`, `${args.writer}.write(${ucsNull})`);
        }
        code.write('}');
      } else if (schema.optional) {
        code.write(`if (${value} != null) {`).indent(build);
        if (buildUndefined) {
          code.write(`} else {`).indent(buildUndefined);
        }
        code.write(`}`);
      } else {
        code.write(build);
      }
    };
  }

  #writeWith(
    fn: UcsFunction,
    schema: UcSchema,
    code: UccCode,
    serializer: string,
    value: string,
  ): void {
    const serializerAlias = fn.lib.import(SERIALIZER_MODULE, serializer);

    code.write(
      this.#checkConstraints(fn, schema, value, code => {
        code.write(`${serializerAlias}(${fn.args.writer}, ${value})`);
      }),
    );
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
