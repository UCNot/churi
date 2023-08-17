import { asArray } from '@proc7ts/primitives';
import { UcConstraints, UcProcessorName, UcSchemaConstraint } from '../../schema/uc-constraints.js';
import { UcPresentationName, UcPresentations } from '../../schema/uc-presentations.js';
import { UcDataType, UcSchema } from '../../schema/uc-schema.js';
import { ucSchemaVariant } from '../impl/uc-schema-variant.js';

export class UccSchemaIndex {

  readonly #processors: readonly UcProcessorName[];
  readonly #presentations: readonly UcPresentationName[];
  readonly #types = new Map<string | UcDataType, UccSchemaIndex$TypeEntry>();
  readonly #typesByPrefix = new Map<string, UccSchemaIndex$TypeEntry>();
  #typeCounter = 0;
  readonly #schemaIds = new WeakMap<UcSchema, string>();

  constructor(
    processors: readonly UcProcessorName[],
    presentations: readonly UcPresentationName[],
  ) {
    this.#processors = processors;
    this.#presentations = presentations.length ? [...new Set(presentations).add('inset')] : [];
  }

  get processors(): readonly UcProcessorName[] {
    return this.#processors;
  }

  get presentations(): readonly UcPresentationName[] {
    return this.#presentations;
  }

  listPresentations(presentations: UcPresentations | undefined): readonly UcPresentationName[] {
    if (!presentations) {
      return [];
    }

    const names = this.presentations;

    return names.length ? names : (Object.keys(presentations) as UcPresentationName[]);
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

    const { where, within } = schema;

    return `${fullId}${this.#constraintsId(schema, where)}${this.#presentationsId(schema, within)}`;
  }

  #presentationsId(schema: UcSchema, presentations?: UcPresentations): string {
    return this.listPresentations(presentations)
      .map(presentationName => {
        const constraintsId = this.#constraintsId(schema, presentations![presentationName]);

        return constraintsId ? `,~${presentationName}(${constraintsId.slice(1)})` : '';
      })
      .join('');
  }

  #constraintsId(schema: UcSchema, constraints: UcConstraints = {}): string {
    return this.processors
      .map(processorName => asArray(constraints[processorName])
          .map(feature => this.#featureConstraintId(schema, feature))
          .join(''))
      .join('');
  }

  #featureConstraintId(schema: UcSchema, feature: UcSchemaConstraint): string {
    const { use, from } = feature;
    const id = feature.id
      ? feature.id(schema, schema => this.schemaId(schema))
      : UcsSchemaIndex$defaultConstraintId(feature);

    return `,${use}@${from}` + (id ? `(${id})` : '');
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

function UcsSchemaIndex$defaultConstraintId({ with: options }: UcSchemaConstraint): string {
  return options !== undefined ? JSON.stringify(options) : '';
}
