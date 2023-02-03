import { ucSchemaName } from '../schema/uc-schema-name.js';
import { UcSchema } from '../schema/uc-schema.js';

export class UnsupportedUcSchemaError extends TypeError {

  readonly #schema: UcSchema;

  constructor(
    schema: UcSchema,
    message = `Unsupported type "${ucSchemaName(schema)}"`,
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
