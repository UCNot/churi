import { asArray } from '@proc7ts/primitives';
import { UcFeatureConstraint, UcProcessorName } from '../../schema/uc-constraints.js';
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
    let { prefix: fullId } = this.#typeEntry(schema);
    const variant = ucSchemaVariant(schema);

    if (variant) {
      fullId += `,${variant}`;
    }

    const { where = {} } = schema;

    return this.processors.reduce((fullId, processorName) => {
      const constraints = where[processorName];

      if (!constraints) {
        return fullId;
      }

      return asArray(constraints).reduce((fullId, constraint): string => {
        const { use, from } = constraint;
        const id = constraint.id
          ? constraint.id(schema, schema => this.schemaId(schema))
          : UcsSchemaIndex$defaultConstraintId(constraint);

        return fullId + `,${use}@${from}` + (id ? `(${id})` : '');
      }, fullId);
    }, fullId);
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
      });
    }

    return this.#addEntry({
      type,
      prefix,
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
}

function UcsSchemaIndex$defaultConstraintId({ with: options }: UcFeatureConstraint): string {
  return options !== undefined ? JSON.stringify(options) : '';
}
