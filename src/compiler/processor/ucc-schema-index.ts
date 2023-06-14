import { UcInstructions } from '../../schema/uc-instructions.js';
import { UcDataType, UcSchema } from '../../schema/uc-schema.js';
import { ucSchemaVariant } from '../impl/uc-schema-variant.js';

export class UccSchemaIndex {

  readonly #tools: readonly UcInstructions.ToolName[];
  readonly #types = new Map<string | UcDataType, UccSchemaIndex$TypeEntry>();
  readonly #typesByPrefix = new Map<string, UccSchemaIndex$TypeEntry>();
  #typeCounter = 0;
  readonly #schemaIds = new WeakMap<UcSchema, string>();

  constructor(tools: readonly UcInstructions.ToolName[]) {
    this.#tools = tools;
  }

  get tools(): readonly UcInstructions.ToolName[] {
    return this.#tools;
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

    if (this.#tools.some(tool => schema.with?.[tool]?.use)) {
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
