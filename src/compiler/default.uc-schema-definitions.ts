import { chargeURIKey } from '../charge/charge-uri.js';
import { CHURI_MODULE, URI_CHARGE_MODULE } from '../impl/module-names.js';
import { UcList } from '../schema/uc-list.js';
import { UcMap } from '../schema/uc-map.js';
import { ucNullable, ucOptional, UcSchema } from '../schema/uc-schema.js';
import { UcCodeBuilder } from './uc-code-builder.js';
import { UcSchemaCompiler } from './uc-schema-compiler.js';
import { UcSchemaDefinitions } from './uc-schema-definitions.js';
import { UnsupportedUcSchema } from './unsupported-uc-schema.js';

class Default$UcSchemaDefinitions implements UcSchemaDefinitions {

  readonly #byType: { readonly [type: string]: UcSchemaDefinitions['write'] };

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

  write(
    compiler: UcSchemaCompiler,
    schema: UcSchema,
    value: string,
    code: UcCodeBuilder,
  ): boolean | void {
    const coder = this.#byType[schema.type];

    return coder?.(compiler, schema, value, code);
  }

  #writeBigInt(
    compiler: UcSchemaCompiler,
    schema: UcSchema,
    value: string,
    code: UcCodeBuilder,
  ): void {
    this.#writeWith(compiler, schema, 'writeUcBigInt', value, code);
  }

  #writeBoolean(
    compiler: UcSchemaCompiler,
    schema: UcSchema,
    value: string,
    code: UcCodeBuilder,
  ): void {
    this.#writeWith(compiler, schema, 'writeUcBoolean', value, code);
  }

  #writeNumber(
    compiler: UcSchemaCompiler,
    schema: UcSchema,
    value: string,
    code: UcCodeBuilder,
  ): void {
    this.#writeWith(compiler, schema, 'writeUcNumber', value, code);
  }

  #writeASCII(compiler: UcSchemaCompiler, code: UcCodeBuilder, value: string): void {
    const writeASCII = compiler.lib.import(URI_CHARGE_MODULE, 'writeUcASCII');

    code.write(`await ${writeASCII}(${value});`);
  }

  #writeList<TItem, TItemSpec extends UcSchema.Spec<TItem>>(
    compiler: UcSchemaCompiler,
    schema: UcList.Schema<TItem, TItemSpec>,
    value: string,
    code: UcCodeBuilder,
  ): void {
    const itemSchema = schema.item.optional
      ? ucOptional(ucNullable(schema.item), false) // Write `undefined` items as `null`
      : schema.item;
    const itemValue = compiler.aliases.aliasFor(`${value}$item`);
    const itemWritten = compiler.aliases.aliasFor(`${value}$itemWritten`);

    this.#checkConstraints(compiler, schema, value, code, code => {
      code
        .write(`let ${itemWritten} = false;`)
        .write(`for (const ${itemValue} of ${value}) {`)
        .indent(code => {
          code
            .write(`if (!${itemWritten}) {`)
            .indent(code => {
              this.#writeASCII(compiler, code, "'('");
              code.write(`${itemWritten} = true;`);
            })
            .write('} else {')
            .indent(code => {
              this.#writeASCII(compiler, code, "')('");
            })
            .write('}');
          try {
            compiler.serialize(itemSchema, itemValue, code);
          } catch (cause) {
            throw new UnsupportedUcSchema(
              itemSchema,
              `Can not serialize list item of type "${itemSchema.type}" from "${itemSchema.from}"`,
              { cause },
            );
          }
        })
        .write(`}`);
      this.#writeASCII(compiler, code, `${itemWritten} ? ')' : '!!'`);
    });
  }

  #writeMap<TEntriesSpec extends UcMap.Schema.Entries.Spec>(
    compiler: UcSchemaCompiler,
    schema: UcMap.Schema<TEntriesSpec>,
    value: string,
    code: UcCodeBuilder,
  ): void {
    const entryWritten = compiler.aliases.aliasFor(`${value}$entryWritten`);
    const entryValue = compiler.aliases.aliasFor(`${value}$entryValue`);

    this.#checkConstraints(compiler, schema, value, code, code => {
      code.write(`let ${entryWritten} = false;`);
      code.write(`let ${entryValue};`);

      for (const [key, entrySchema] of Object.entries<UcSchema>(schema.entries)) {
        code.write(`${entryValue} = ${value}${propertyAccessExpr(key)};`); // FIXME Proper key accessor expression.

        this.#checkConstraints(
          compiler,
          entrySchema,
          entryValue,
          code,
          code => {
            this.#writeASCII(compiler, code, `'${chargeURIKey(key)}('`);
            try {
              compiler.serialize(
                ucOptional(ucNullable(entrySchema, false), false),
                entryValue,
                code,
              );
            } catch (cause) {
              throw new UnsupportedUcSchema(
                entrySchema,
                `Can not serialize entry "${key}" of type "${entrySchema.type}" from "${entrySchema.from}"`,
                { cause },
              );
            }
            this.#writeASCII(compiler, code, `')'`);
            code.write(`${entryWritten} = true;`);
          },
          code => {
            this.#writeASCII(compiler, code, `'${chargeURIKey(key)}(--)'`);
            code.write(`${entryWritten} = true;`);
          },
        );
      }

      code
        .write(`if (!${entryWritten}) {`)
        .indent(code => {
          this.#writeASCII(compiler, code, `'$'`);
        })
        .write('}');
    });
  }

  #writeString(
    compiler: UcSchemaCompiler,
    schema: UcSchema,
    value: string,
    code: UcCodeBuilder,
  ): void {
    const encoder = this.#declareEncoder(compiler);

    this.#writeWith(compiler, schema, 'writeUcString', value, code, `, ${encoder}`);
  }

  #declareEncoder(compiler: UcSchemaCompiler): string {
    return compiler.declare('encoder', 'new TextEncoder()');
  }

  #checkConstraints(
    compiler: UcSchemaCompiler,
    schema: UcSchema,
    value: string,
    code: UcCodeBuilder,
    build: (code: UcCodeBuilder) => void,
    buildNull?: (code: UcCodeBuilder) => void,
    buildUndefined?: (code: UcCodeBuilder) => void,
  ): void {
    if (schema.nullable) {
      code.write(`if (${value} != null) {`).indent(code => {
        build(code);
      });
      if (schema.optional) {
        code.write(`} else if (${value} === null) {`).indent(code => {
          if (buildNull) {
            buildNull(code);
          } else {
            this.#writeASCII(compiler, code, "'--'");
          }
        });
        if (buildUndefined) {
          code.write(`} else {`).indent(code => {
            buildUndefined(code);
          });
        }
      } else {
        code.write(`} else {`).indent(code => {
          if (buildNull) {
            buildNull(code);
          } else {
            this.#writeASCII(compiler, code, "'--'");
          }
        });
      }
      code.write('}');
    } else if (schema.optional) {
      code.write(`if (${value} != null) {`).indent(code => {
        build(code);
      });
      if (buildUndefined) {
        code.write(`} else {`);
        buildUndefined(code);
      }
      code.write(`}`);
    } else {
      build(code);
    }
  }

  #writeWith(
    compiler: UcSchemaCompiler,
    schema: UcSchema,
    serializer: string,
    value: string,
    code: UcCodeBuilder,
    extraArgs = '',
  ): void {
    const serializerAlias = compiler.lib.import(serializer, URI_CHARGE_MODULE);
    const write = `${serializerAlias}(writer, ${value}${extraArgs})`;

    if (schema.nullable) {
      const writeASCII = compiler.lib.import(URI_CHARGE_MODULE, 'writeUcASCII');
      const writeNull = `${writeASCII}(writer, '--')`;

      if (schema.optional) {
        code.write(`await ${value} != null ? ${write} : ${value} === null && ${writeNull};`);
      } else {
        code.write(`await ${value} != null ? ${write} : ${writeNull};`);
      }
    } else {
      code.write(schema.optional ? `${value} != null && await ${write};` : `await ${write};`);
    }
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

export const DefaultUcSchemaDefinitions = /*#__PURE__*/ new Default$UcSchemaDefinitions();
