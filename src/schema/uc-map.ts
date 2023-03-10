import { asis } from '@proc7ts/primitives';
import { UcdUcrx, UcdUcrxLocation } from '../compiler/deserialization/ucd-ucrx.js';
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
   * @typeParam TExtraSpec - Schema specifier for extra entries, or `false` to prohibit extra entries.
   */
  export interface Schema<
    TEntriesSpec extends Schema.Entries.Spec,
    TExtraSpec extends UcSchema.Spec | false = false,
  > extends UcSchema<ObjectType<TEntriesSpec, TExtraSpec>> {
    readonly type: 'map';
    readonly entries: Schema.Entries<TEntriesSpec>;
    readonly extra: TExtraSpec extends UcSchema.Spec ? UcSchema.Of<TExtraSpec> : false;

    /**
     * Generates initialization code of {@link @hatsy/churi!Ucrx charge receiver} properties.
     *
     * {@link @hatsy/churi/compiler!MapUcdDef Map deserializer definition} is used by default.
     *
     * @param location - A location inside deserializer function to insert generated code into.
     *
     * @returns Per-property initializers, or `undefined` if the receiver can not be generated.
     */
    initRx?(
      location: UcdUcrxLocation<
        UcMap.ObjectType<TEntriesSpec, TExtraSpec>,
        UcMap.Schema<TEntriesSpec, TExtraSpec>
      >,
    ): UcdUcrx | undefined;
  }

  /**
   * Type of object compatible with schema of URI charge map.
   *
   * @typeParam TEntriesSpec - Per-entry schema specifier type.
   * @typeParam TExtraSpec - Schema specifier for extra entries, or `false` to prohibit extra entries.
   */
  export type ObjectType<
    TEntriesSpec extends Schema.Entries.Spec,
    TExtraSpec extends UcSchema.Spec | false = false,
  > = {
    -readonly [key in RequiredKeys<TEntriesSpec>]: UcSchema.DataType<TEntriesSpec[key]>;
  } & {
    -readonly [key in OptionalKeys<TEntriesSpec>]?: UcSchema.DataType<TEntriesSpec[key]>;
  } & (TExtraSpec extends UcSchema.Spec<any>
      ? { [key in Exclude<string, keyof TEntriesSpec>]: UcSchema.DataType<TExtraSpec> }
      : { [key in never]: never });

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

  export type ExtraKeys<TEntriesSpec extends Schema.Entries.Spec> = Exclude<
    string,
    keyof TEntriesSpec
  >;

  export namespace Schema {
    /**
     * Schema specifier of URI charge map.
     *
     * @typeParam TEntriesSpec - Per-entry schema specifier type.
     * @typeParam TExtraSpec - Schema specifier for extra entries, or `false` to prohibit extra entries.
     */
    export type Spec<
      TEntriesSpec extends Entries.Spec,
      TExtraSpec extends UcSchema.Spec | false = false,
    > = Schema<TEntriesSpec, TExtraSpec> | Ref<TEntriesSpec, TExtraSpec>;

    /**
     * Reference to schema of URI charge map.
     *
     * @typeParam TEntriesSpec - Per-entry schema specifier type.
     * @typeParam TExtraSpec - Schema specifier for extra entries, or `false` to prohibit extra entries.
     */
    export type Ref<
      TEntriesSpec extends Entries.Spec,
      TExtraSpec extends UcSchema.Spec | false = false,
    > = UcSchema.Ref<ObjectType<TEntriesSpec, TExtraSpec>, Schema<TEntriesSpec, TExtraSpec>>;

    /**
     * Per-entry schema of URI charge map.
     *
     * @typeParam TEntriesSpec - Per-entry schema specifier type.
     * @typeParam TExtraSpec - Schema specifier for extra entries, or `false` to prohibit extra entries.
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

    /**
     * Additional options for URI charge map schema.
     *
     * @typeParam TEntriesSpec - Per-entry schema specifier type.
     * @typeParam TExtraSpec - Schema specifier for extra entries, or `false` to prohibit extra entries.
     */
    export interface BaseOptions<
      TEntriesSpec extends Entries.Spec,
      TExtraSpec extends UcSchema.Spec | false,
    > {
      /**
       * Unique schema identifier.
       *
       * @defaultValue Autogenerated string.
       */
      readonly id?: string | UcSchema.Class | undefined;

      /**
       * Generates initialization code of {@link @hatsy/churi!Ucrx charge receiver} properties.
       *
       * {@link @hatsy/churi/compiler!MapUcdDef Map deserializer definition} is used by default.
       *
       * @param location - A location inside deserializer function to insert generated code into.
       *
       * @returns Per-property initializers, or `undefined` if the receiver can not be generated.
       */
      initRx?(
        location: UcdUcrxLocation<
          UcMap.ObjectType<TEntriesSpec, TExtraSpec>,
          UcMap.Schema<TEntriesSpec, TExtraSpec>
        >,
      ): UcdUcrx | undefined;
    }

    export type Options<TEntriesSpec extends Entries.Spec, TExtraSpec extends UcSchema.Spec> =
      | ExactOptions<TEntriesSpec>
      | ExtraOptions<TEntriesSpec, TExtraSpec>;

    export interface ExactOptions<TEntriesSpec extends Entries.Spec>
      extends BaseOptions<TEntriesSpec, false> {
      readonly extra?: false | undefined;
    }

    export interface ExtraOptions<
      TEntriesSpec extends Entries.Spec,
      TExtraSpec extends UcSchema.Spec,
    > extends BaseOptions<TEntriesSpec, TExtraSpec> {
      readonly extra: TExtraSpec;
    }
  }
}

/**
 * Creates a reference to URI charge schema for JavaScript {@link UcMap object} serialized as map.
 *
 * @typeParam TEntriesSpec - Per-entry schema specifier type.
 * @param entries - Per-entry schema entries spec.
 * @param options - Schema options.
 *
 * @returns Reference to schema of URI charge map.
 */
export function ucMap<TEntriesSpec extends UcMap.Schema.Entries.Spec>(
  spec: TEntriesSpec,
  options?: UcMap.Schema.ExactOptions<TEntriesSpec>,
): UcMap.Schema.Ref<TEntriesSpec>;

export function ucMap<
  TEntriesSpec extends UcMap.Schema.Entries.Spec,
  TExtraSpec extends UcSchema.Spec,
>(
  spec: TEntriesSpec,
  options: UcMap.Schema.ExtraOptions<TEntriesSpec, TExtraSpec>,
): UcMap.Schema.Ref<TEntriesSpec, TExtraSpec>;

export function ucMap<
  TEntriesSpec extends UcMap.Schema.Entries.Spec,
  TExtraSpec extends UcSchema.Spec,
>(
  spec: TEntriesSpec,
  { id, extra, initRx }: UcMap.Schema.Options<TEntriesSpec, TExtraSpec> = {},
): UcMap.Schema.Ref<TEntriesSpec, TExtraSpec> {
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
        id: id ?? `map_${++UcMap$idSeq}`,
        asis,
        entries: Object.fromEntries(entries) as UcMap.Schema.Entries<TEntriesSpec>,
        extra: (extra ? resolver.schemaOf(extra) : false) as UcMap.Schema<
          TEntriesSpec,
          TExtraSpec
        >['extra'],
        initRx: initRx as UcMap.Schema<TEntriesSpec, TExtraSpec>['initRx'],
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

let UcMap$idSeq = 0;
