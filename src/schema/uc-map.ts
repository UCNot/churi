import { asis } from '@proc7ts/primitives';
import { UcPrimitive } from './uc-primitive.js';
import { UcSchema, UC_DATA_ENCODED } from './uc-schema.js';
import { UcValue } from './uc-value.js';

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
   * URI charge schema definition for JavaScript {@link UcMap object} serialized as map.
   *
   * @typeParam TEntriesSpec - Per-entry schema specifier type.
   */
  export interface Schema<TEntriesSpec extends Schema.Entries.Spec>
    extends UcSchema<ObjectType<TEntriesSpec>> {
    readonly entries: Schema.Entries<TEntriesSpec>;
  }

  /**
   * Type of object implied by schema of URI charge map.
   *
   * @typeParam TEntriesSpec - Per-entry schema specifier type.
   */
  export type ObjectType<TEntriesSpec extends Schema.Entries.Spec> = {
    -readonly [key in keyof TEntriesSpec]: UcSchema.DataType<TEntriesSpec[key]>;
  };

  export namespace Schema {
    /**
     * Schema specifier of URI charge map.
     *
     * @typeParam TEntriesSpec - Per-entry schema specifier type.
     */
    export type Spec<TEntriesSpec extends Entries.Spec> = Schema<TEntriesSpec> | Ref<TEntriesSpec>;

    /**
     * Reference to schema of URI charge map.
     *
     * @typeParam TEntriesSpec - Per-entry schema specifier type.
     */
    export type Ref<TEntriesSpec extends Entries.Spec> = UcSchema.Ref<
      ObjectType<TEntriesSpec>,
      Schema<TEntriesSpec>
    >;

    /**
     * Per-entry schema of URI charge map.
     *
     * @typeParam TEntriesSpec - Per-entry schema specifier type.
     */
    export type Entries<TEntriesSpec extends Entries.Spec> = {
      readonly [key in keyof TEntriesSpec]: UcSchema.Of<TEntriesSpec[key]>;
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
 * Creates a reference to URI charge schema for JavaScript {@link UcMap object} serialized as map.
 *
 * @typeParam TEntriesSpec - Per-entry schema specifier type.
 * @param entries - Per-entry schema entries spec.
 *
 * @returns Reference to schema of URI charge map.
 */
export function UcMap<TEntriesSpec extends UcMap.Schema.Entries.Spec>(
  spec: TEntriesSpec,
): UcMap.Schema.Ref<TEntriesSpec> {
  return resolver => {
    let flags = 0;
    const entries = Object.fromEntries(
      Object.entries<UcSchema.Spec>(spec).map(([key, spec]) => {
        const schema = resolver.schemaOf(spec);

        flags |= (schema.flags ?? 0) & UC_DATA_ENCODED;

        return [key, schema];
      }),
    ) as UcMap.Schema.Entries<TEntriesSpec>;

    return {
      from: '@hatsy/churi',
      type: 'map',
      flags,
      entries,
      asis,
    };
  };
}
