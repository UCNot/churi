import { UcSchema } from './uc-schema.js';

/**
 * URI charge schema resolver.
 *
 * Used to resolve {@link UcSchema.Ref schema references}.
 */
export class UcSchemaResolver {

  readonly #cache = new WeakMap<UcSchema.Ref, UcSchema>();

  /**
   * Resolves URI charge schema instance by the given specifier.
   *
   * For schema {@link UcSchema instance} returns itself.
   *
   * For schema {@link UcSchema.Ref reference}, builds the schema first, unless built already. Then caches the schema to
   * return by subsequent calls.
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

    const cached = this.#cache.get(spec) as TSchema | undefined;

    if (cached) {
      return cached;
    }

    const schema = spec(this);

    this.#cache.set(spec, schema);

    return schema;
  }

}
