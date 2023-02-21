import { asis } from '@proc7ts/primitives';
import { quotePropertyKey } from '../impl/quote-property-key.js';
import { UcPrimitive } from './uc-primitive.js';
import { ucSchemaName } from './uc-schema-name.js';
import { UcSchema, UcSchema__symbol } from './uc-schema.js';
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
   * Such schema can be built with {@link ucMap} function.
   *
   * @typeParam TEntriesSpec - Per-entry schema specifier type.
   */
  export interface Schema<TEntriesSpec extends Schema.Entries.Spec>
    extends UcSchema<ObjectType<TEntriesSpec>> {
    readonly type: 'map';
    readonly entries: Schema.Entries<TEntriesSpec>;
  }

  /**
   * Type of object compatible with schema of URI charge map.
   *
   * @typeParam TEntriesSpec - Per-entry schema specifier type.
   */
  export type ObjectType<TEntriesSpec extends Schema.Entries.Spec> = {
    -readonly [key in RequiredKeys<TEntriesSpec>]: UcSchema.DataType<TEntriesSpec[key]>;
  } & {
    -readonly [key in OptionalKeys<TEntriesSpec>]?: UcSchema.DataType<TEntriesSpec[key]>;
  };

  export type Required<
    TEntriesSpec extends Schema.Entries.Spec,
    TKey extends keyof TEntriesSpec = keyof TEntriesSpec,
  > = undefined extends UcSchema.DataType<TEntriesSpec[TKey]> ? TKey : never;

  export type RequiredKeys<
    TEntriesSpec extends Schema.Entries.Spec,
    TKey extends keyof TEntriesSpec = keyof TEntriesSpec,
  > = undefined extends UcSchema.DataType<TEntriesSpec[TKey]> ? never : TKey;

  export type OptionalKeys<
    TEntriesSpec extends Schema.Entries.Spec,
    TKey extends keyof TEntriesSpec = keyof TEntriesSpec,
  > = undefined extends UcSchema.DataType<TEntriesSpec[TKey]> ? TKey : never;

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
export function ucMap<TEntriesSpec extends UcMap.Schema.Entries.Spec>(
  spec: TEntriesSpec,
): UcMap.Schema.Ref<TEntriesSpec> {
  return {
    [UcSchema__symbol]: resolver => {
      const entries: [string, UcSchema][] = Object.entries<UcSchema.Spec>(spec).map(
        ([key, spec]) => {
          const schema = resolver.schemaOf(spec);

          return [key, schema];
        },
      );

      return {
        type: 'map',
        entries: Object.fromEntries(entries) as UcMap.Schema.Entries<TEntriesSpec>,
        asis,
        toString() {
          let out = '{';

          entries.every(([key, entry], i) => {
            if (i) {
              out += ', ';
            }
            out += quotePropertyKey(key) + ': ' + ucSchemaName(entry);

            if (i < 2) {
              return true;
            }

            out += ', ...';

            return false;
          });

          return out + '}';
        },
      };
    },
  };
}
