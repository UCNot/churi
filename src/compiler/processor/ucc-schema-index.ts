import { UcProcessorName } from '../../schema/uc-constraints.js';
import { UcDataType, UcSchema } from '../../schema/uc-schema.js';
import { ucSchemaVariant } from '../impl/uc-schema-variant.js';

export class UccSchemaIndex {

  readonly #processors: readonly UcProcessorName[];
  readonly #types = new Map<string | UcDataType, UccSchemaIndex$TypeEntry>();
  readonly #typesByPrefix = new Map<string, UccSchemaIndex$TypeEntry>();
  #typeCounter = 0;
  readonly #schemaIds = new WeakMap<UcSchema, string>();

  constructor(processors: readonly UcProcessorName[]) {
    this.#processors = processors;
  }

  get processors(): readonly UcProcessorName[] {
    return this.#processors;
  }

  schemaId(schema: UcSchema): string {
    let schemaId = this.#schemaIds.get(schema);

    if (!schemaId) {
      schemaId = this.#createSchemaId(schema);
      this.#schemaIds.set(schema, schemaId);
    }

    return schemaId;
  }

  #createSchemaId(schema: UcSchema): string {
    const typeEntry = this.#typeEntry(schema);
    const typeId = `${typeEntry.prefix}${ucSchemaVariant(schema)}`;

    if (this.processors.some(name => schema.where?.[name])) {
      return `${typeId}#${++typeEntry.counter}`;
    }

    return typeId;
  }

  #typeEntry({ type }: UcSchema): UccSchemaIndex$TypeEntry {
    const entry = this.#types.get(type);

    if (entry) {
      return entry;
    }

    const prefix = typeof type === 'string' ? type : type.name;
    const entryByPrefix = this.#typesByPrefix.get(prefix);

    if (entryByPrefix && entryByPrefix.type !== type) {
      return this.#addEntry({
        type,
        prefix: `${prefix}#${++this.#typeCounter}`,
        counter: 0,
      });
    }

    return this.#addEntry({
      type,
      prefix,
      counter: 0,
    });
  }

  #addEntry(entry: UccSchemaIndex$TypeEntry): UccSchemaIndex$TypeEntry {
    this.#types.set(entry.type, entry);
    this.#typesByPrefix.set(entry.prefix, entry);

    return entry;
  }

}

interface UccSchemaIndex$TypeEntry {
  readonly type: string | UcDataType;
  readonly prefix: string;
  counter: number;
}
