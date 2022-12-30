import { UcSchema } from '../schema/uc-schema.js';

export class UnsupportedUcSchema extends TypeError {

  readonly #schema: UcSchema;

  constructor(
    schema: UcSchema,
    message = `Unsupported type "${schema.type}" from "${schema.from}"`,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'UnsupportedUcSchema';
    this.#schema = schema;
  }

  get schema(): UcSchema {
    return this.#schema;
  }

}
