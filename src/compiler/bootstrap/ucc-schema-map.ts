import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccSchemaIndex } from './ucc-schema-index.js';

export class UccSchemaMap<T> {
  readonly #index: UccSchemaIndex;
  readonly #map = new Map<string, T>();

  constructor(index: UccSchemaIndex) {
    this.#index = index;
  }

  get(schema: UcSchema, within?: UcPresentationName): T | undefined {
    return (
      this.#map.get(this.#presentationId(schema, within)) ??
      (within && this.#map.get(this.#schemaId(schema)))
    );
  }

  set(schema: UcSchema, value: T, within?: UcPresentationName): void {
    this.#map.set(this.#presentationId(schema, within), value);
  }

  #presentationId(schema: UcSchema, within: UcPresentationName | undefined): string {
    return within ? `within:${within}:${this.#index.schemaId(schema)}` : this.#schemaId(schema);
  }

  #schemaId(schema: UcSchema): string {
    return `schema:${this.#index.schemaId(schema)}`;
  }
}
