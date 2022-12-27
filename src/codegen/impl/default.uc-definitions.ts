import { CHURI_MODULE, URI_CHARGE_MODULE } from '../../impl/module-names.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcDefinitions } from '../uc-definitions.js';
import { UcWriterGenerator } from '../uc-writer-generator.js';

class Default$UcDefinitions implements UcDefinitions {

  readonly #byType: { readonly [type: string]: UcDefinitions['write'] };

  constructor() {
    this.#byType = {
      bigint: this.#writeBigInt.bind(this),
      boolean: this.#writeBoolean.bind(this),
      number: this.#writeNumber.bind(this),
      string: this.#writeString.bind(this),
    };
  }

  get from(): string {
    return CHURI_MODULE;
  }

  write(generator: UcWriterGenerator, schema: UcSchema, value: string): void {
    const coder = this.#byType[schema.type];

    if (!coder) {
      throw new TypeError(
        `Do not know how to serialize data of type "${schema.type}" from "${schema.from}"`,
      );
    }

    coder(generator, schema, value);
  }

  #writeBigInt(generator: UcWriterGenerator, schema: UcSchema, value: string): void {
    this.#writeWith(generator, schema, 'writeUcBigInt', value);
  }

  #writeBoolean(generator: UcWriterGenerator, schema: UcSchema, value: string): void {
    this.#writeWith(generator, schema, 'writeUcBoolean', value);
  }

  #writeNumber(generator: UcWriterGenerator, schema: UcSchema, value: string): void {
    this.#writeWith(generator, schema, 'writeUcNumber', value);
  }

  #writeString(generator: UcWriterGenerator, schema: UcSchema, value: string): void {
    const encoder = this.#declareEncoder(generator);

    this.#writeWith(generator, schema, 'writeUcString', value, `, ${encoder}`);
  }

  #declareEncoder(generator: UcWriterGenerator): string {
    return generator.declare('encoder', 'new TextEncoder()');
  }

  #writeWith(
    generator: UcWriterGenerator,
    schema: UcSchema,
    fn: string,
    value: string,
    extraArgs = '',
  ): void {
    const write = generator.import(fn, URI_CHARGE_MODULE);
    const code = `${write}(writer, ${value}${extraArgs})`;

    if (schema.nullable) {
      const writeNull = generator.import('writeUcNull', URI_CHARGE_MODULE);
      const checkNullCode = `await ${value} != null ? ${code} : ${writeNull}(writer, ${value})`;

      generator.write(
        schema.optional ? `${value} !== undefined && ${checkNullCode}\n;` : `${checkNullCode}\n;`,
      );
    } else {
      generator.write(
        schema.optional ? `${value} != null && await ${code}\n;` : `await ${code}\n;`,
      );
    }
  }

}

export const DefaultUcDefinitions = /*#__PURE__*/ new Default$UcDefinitions();
