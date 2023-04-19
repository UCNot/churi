import { ucModelName } from '../schema/uc-model-name.js';
import { UcSchema } from '../schema/uc-schema.js';

export class UnsupportedUcSchemaError extends TypeError {

  readonly #schema: UcSchema;

  constructor(
    schema: UcSchema,
    message = `Unsupported type "${ucModelName(schema)}"`,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'UnsupportedUcSchemaError';
    this.#schema = schema;
  }

  get schema(): UcSchema {
    return this.#schema;
  }

}
