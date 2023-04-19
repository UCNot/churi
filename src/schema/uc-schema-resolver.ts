import { UcSchema } from './uc-schema.js';

/**
 * Resolver of URI charge {@link UcSchema.Ref schema references}.
 *
 * Used to cache resolved schema instances and prevent unnecessary re-evaluation.
 */
export class UcSchemaResolver {

  readonly #cache = new WeakMap<
    UcSchema.Class | ((resolver: UcSchemaResolver) => UcSchema),
    () => UcSchema
  >();

  /**
   * Resolves URI charge schema instance by the given specifier.
   *
   * For schema {@link UcSchema instance} just returns it.
   *
   * For schema {@link UcSchema.Ref reference}, builds the schema first, unless built already. Then caches the schema to
   * return from subsequent calls.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   * @param spec - Schema specifier to resolve.
   *
   * @returns Resolved schema.
   */
  schemaOf<T, TSchema extends UcSchema<T> = UcSchema<T>>(spec: UcSchema.Spec<T, TSchema>): TSchema {
    if (typeof spec !== 'function') {
      return spec;
    }

    const cached = this.#cache.get(spec) as (() => TSchema) | undefined;

    if (cached) {
      return cached();
    }

    const getSchema: () => TSchema = () => this.#resolveClass<T>(spec) as TSchema;

    this.#cache.set(spec, getSchema);

    return getSchema();
  }

  #resolveClass<T>(type: UcSchema.Class<T>): UcSchema<T> {
    return {
      optional: false,
      nullable: false,
      type,
    };
  }

}
