import { UcFormatName } from '../../../schema/uc-presentations.js';
import { UcSchema } from '../../../schema/uc-schema.js';
import { UccSchemaIndex } from '../../processor/ucc-schema-index.js';
import { UcsFormatter } from '../ucs-formatter.js';
import { UcsInsetWrapper } from '../ucs-inset-formatter.js';
import { CreateUcsWriterExpr } from '../ucs-writer.class.js';

export class UcsPresentationConfig<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #schemaIndex: UccSchemaIndex;
  readonly #schemaFormatters = new Map<string, UcsFormatter<T, TSchema>>();
  readonly #schemaInsetWrappers = new Map<string, UcsInsetWrapper>();
  #typeFormatter: UcsFormatter<T, TSchema> | undefined;
  #typeInsetWrapper?: UcsInsetWrapper | undefined;
  insetWrapper?: UcsInsetWrapper | undefined;
  createWriter?: CreateUcsWriterExpr | undefined;

  constructor(schemaIndex: UccSchemaIndex, readonly format: UcFormatName) {
    this.#schemaIndex = schemaIndex;
  }

  formatTypeWith(formatter: UcsFormatter<T, TSchema> | undefined): void {
    if (formatter) {
      this.#typeFormatter = formatter;
    }
  }

  modifyTypeInsets(wrapper: UcsInsetWrapper): void {
    this.#typeInsetWrapper = wrapper;
  }

  formatSchemaWith(schema: TSchema, formatter: UcsFormatter<T, TSchema> | undefined): void {
    if (formatter) {
      const schemaId = this.#schemaIndex.schemaId(schema);

      this.#schemaFormatters.set(schemaId, formatter);
    }
  }

  modifySchemaInsets(schema: TSchema, wrapper: UcsInsetWrapper): void {
    const schemaId = this.#schemaIndex.schemaId(schema);

    this.#schemaInsetWrappers.set(schemaId, wrapper);
  }

  formatterFor(schema: TSchema): UcsFormatter<T, TSchema> | undefined {
    const schemaId = this.#schemaIndex.schemaId(schema);

    return this.#schemaFormatters.get(schemaId) ?? this.#typeFormatter;
  }

  insetWrapperFor(schema: TSchema): UcsInsetWrapper | undefined {
    const schemaId = this.#schemaIndex.schemaId(schema);

    return this.#schemaInsetWrappers.get(schemaId) ?? this.#typeInsetWrapper;
  }

}
