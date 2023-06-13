import { UcInstructions } from '../../schema/uc-instructions.js';
import { UcSchema } from '../../schema/uc-schema.js';

export class UccSchemaIndex {

  readonly #tools: readonly UcInstructions.ToolName[];
  readonly #typeCounters = new Map<string, number>();
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
    const { type } = schema;
    const typeId = typeof type === 'string' ? `name:${type}` : `type:${type.name}`;

    if (this.#tools.some(tool => schema.with?.[tool]?.use)) {
      return `${typeId}#${this.#nextIndex(typeId)}`;
    }

    return typeId;
  }

  #nextIndex(typeId: string): number {
    const counter = (this.#typeCounters.get(typeId) ?? 0) + 1;

    this.#typeCounters.set(typeId, counter);

    return counter;
  }

}
