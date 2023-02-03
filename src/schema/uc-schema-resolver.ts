import { asis, lazyValue } from '@proc7ts/primitives';
import { UcSchema, UcSchema__symbol } from './uc-schema.js';

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
    const resolveSchema = spec[UcSchema__symbol];
    let key: UcSchema.Class | ((resolver: UcSchemaResolver) => UcSchema);

    if (resolveSchema) {
      key = resolveSchema;
    } else {
      if (typeof spec !== 'function') {
        return spec;
      }

      key = spec;
    }

    const cached = this.#cache.get(key) as (() => TSchema) | undefined;

    if (cached) {
      return cached();
    }

    const getSchema: () => TSchema = resolveSchema
      ? lazyValue(() => resolveSchema(this)) // Prevent recursive calls.
      : () => ({
            optional: undefined,
            nullable: undefined,
            type: spec,
            asis,
          } as UcSchema<T> as TSchema);

    this.#cache.set(key, getSchema);

    return getSchema();
  }

}
