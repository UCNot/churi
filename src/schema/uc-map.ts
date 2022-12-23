import { asis } from '@proc7ts/primitives';
import { UcSchema, UC_DATA_ENCODED } from './uc-schema.js';
import { UcPrimitive, UcValue } from './uc-value.js';

/**
 * URI charge map represented as JavaScript object.
 *
 * @typeParam TValue - Map entry value type.
 */
export interface UcMap<out TValue = UcPrimitive> {
  [key: string]: UcValue<TValue> | undefined;
}

export namespace UcMap {
  /**
   * URI charge schema definition for JavaScript {@link UcMap objects} serialized as map.
   *
   * @typeParam TSpec - Per-entry schema specifier type.
   */
  export interface Schema<TSpec extends Schema.Entries.Spec> extends UcSchema<ObjectType<TSpec>> {
    readonly entries: Schema.Entries<TSpec>;
  }

  /**
   * Type of object implied by URI charge map schema.
   *
   * @typeParam TSpec - Per-entry schema specifier type.
   */
  export type ObjectType<TSpec extends Schema.Entries.Spec> = {
    -readonly [key in keyof TSpec]: UcSchema.DataType<TSpec[key]>;
  };

  export namespace Schema {
    /**
     * URI charge map schema specifier.
     *
     * @typeParam TSpec - Per-entry schema specifier type.
     */
    export type Spec<TSpec extends Entries.Spec> = Schema<TSpec> | Ref<TSpec>;

    /**
     * URI charge map schema reference signature.
     *
     * @typeParam TSpec - Per-entry schema specifier type.
     */
    export type Ref<TSpec extends Entries.Spec> = UcSchema.Ref<ObjectType<TSpec>, Schema<TSpec>>;

    /**
     * Per-entry schema of URI charge map.
     *
     * @typeParam TSpec - Per-entry schema specifier type.
     */
    export type Entries<TSpec extends Entries.Spec> = {
      readonly [key in keyof TSpec]: UcSchema.Of<TSpec[key]>;
    };

    export namespace Entries {
      /**
       * Per-entry schema specifier of the map.
       *
       * Each property corresponds to a map entry with data type implied by corresponding schema specifier.
       */
      export type Spec = {
        readonly [key in string]: UcSchema.Spec;
      };
    }
  }
}

/**
 * Creates URI charge schema reference for JavaScript {@link UcMap objects} serialized as map.
 *
 * @param entries - Per-entry schema entries spec.
 *
 * @returns URI charge map schema reference.
 */
export function UcMap<TSpec extends UcMap.Schema.Entries.Spec>(
  spec: TSpec,
): UcMap.Schema.Ref<TSpec> {
  return resolver => {
    let flags = 0;
    const entries = Object.fromEntries(
      Object.entries<UcSchema.Spec>(spec).map(([key, spec]) => {
        const schema = resolver.schemaOf(spec);

        flags |= (schema.flags ?? 0) & UC_DATA_ENCODED;

        return [key, schema];
      }),
    ) as UcMap.Schema.Entries<TSpec>;

    return {
      from: '@hatsy/churi',
      type: 'map',
      flags,
      entries,
      asis,
    };
  };
}
