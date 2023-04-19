import { COMPILER_MODULE } from '../../impl/module-names.js';
import { jsPropertyKey } from '../../impl/quote-property-key.js';
import { UcInstructions } from '../uc-instructions.js';
import { ucModelName } from '../uc-model-name.js';
import { UcDataType, UcInfer, UcModel, UcSchema, ucSchema } from '../uc-schema.js';

/**
 * URI charge map represented as JavaScript object.
 */
export interface UcMap {
  [key: string]: unknown;
}

export namespace UcMap {
  /**
   * URI charge schema definition for JavaScript {@link UcMap object} serialized as map.
   *
   * Such schema can be built with {@link ucMap} function.
   *
   * @typeParam TEntriesModel - Per-entry model type.
   * @typeParam TExtraModel - Extra entries model type, or `false` to prohibit extra entries.
   */
  export interface Schema<
    TEntriesModel extends Schema.Entries.Model = Schema.Entries.Model,
    TExtraModel extends UcModel | false = false,
  > extends UcSchema<Infer<TEntriesModel, TExtraModel>> {
    readonly type: 'map';
    readonly entries: Schema.Entries<TEntriesModel>;
    readonly extra: TExtraModel extends UcModel ? UcSchema.Of<TExtraModel> : false;
  }

  /**
   * Type of object inferred from the map model.
   *
   * @typeParam TEntriesModel - Per-entry model type.
   * @typeParam TExtraModel - Extra entries model type, or `false` to prohibit extra entries.
   */
  export type Infer<
    TEntriesModel extends Schema.Entries.Model,
    TExtraModel extends UcModel | false = false,
  > = {
    -readonly [key in RequiredKeys<TEntriesModel>]: UcInfer<TEntriesModel[key]>;
  } & {
    -readonly [key in OptionalKeys<TEntriesModel>]?: UcInfer<TEntriesModel[key]>;
  } & (TExtraModel extends UcModel<any>
      ? { [key in Exclude<string, keyof TEntriesModel>]: UcInfer<TExtraModel> }
      : { [key in never]: never });

  export type Required<
    TEntriesModel extends Schema.Entries.Model,
    TKey extends keyof TEntriesModel = keyof TEntriesModel,
  > = undefined extends UcInfer<TEntriesModel[TKey]> ? TKey : never;

  export type RequiredKeys<
    TEntriesModel extends Schema.Entries.Model,
    TKey extends keyof TEntriesModel = keyof TEntriesModel,
  > = undefined extends UcInfer<TEntriesModel[TKey]> ? never : TKey;

  export type OptionalKeys<
    TEntriesModel extends Schema.Entries.Model,
    TKey extends keyof TEntriesModel = keyof TEntriesModel,
  > = undefined extends UcInfer<TEntriesModel[TKey]> ? TKey : never;

  export type ExtraKeys<TEntriesModel extends Schema.Entries.Model> = Exclude<
    string,
    keyof TEntriesModel
  >;

  export namespace Schema {
    /**
     * Per-entry schema of URI charge map.
     *
     * @typeParam TEntriesModel - Per-entry model type.
     */
    export type Entries<TEntriesModel extends Entries.Model> = {
      readonly [key in keyof TEntriesModel]: UcSchema.Of<TEntriesModel[key]>;
    };

    export namespace Entries {
      /**
       * Per-entry model of the map.
       *
       * Each property corresponds to a map entry with data type implied by corresponding model.
       */
      export type Model = {
        readonly [key in string]: UcModel;
      };
    }

    /**
     * Additional options for the {@link ucMap map schema}.
     */
    export interface BaseOptions {
      /**
       * Unique schema identifier.
       *
       * @defaultValue Autogenerated string.
       */
      readonly id?: string | UcDataType | undefined;
    }

    export type Options<TExtraModel extends UcModel> = ExactOptions | ExtraOptions<TExtraModel>;

    export interface ExactOptions extends BaseOptions {
      readonly extra?: false | undefined;
    }

    export interface ExtraOptions<TExtraModel extends UcModel> extends BaseOptions {
      readonly extra: TExtraModel;
    }
  }
}

/**
 * Creates a reference to URI charge schema for JavaScript {@link UcMap object} serialized as map.
 *
 * @typeParam TEntriesModel - Per-entry model type.
 * @param entries - Per-entry model.
 * @param options - Schema options.
 *
 * @returns New map schema.
 */
export function ucMap<TEntriesModel extends UcMap.Schema.Entries.Model>(
  entries: TEntriesModel,
  options?: UcMap.Schema.ExactOptions,
): UcMap.Schema<TEntriesModel>;

export function ucMap<
  TEntriesModel extends UcMap.Schema.Entries.Model,
  TExtraModel extends UcModel,
>(
  entries: TEntriesModel,
  options: UcMap.Schema.ExtraOptions<TExtraModel>,
): UcMap.Schema<TEntriesModel, TExtraModel>;

export function ucMap<
  TEntriesModel extends UcMap.Schema.Entries.Model,
  TExtraModel extends UcModel,
>(
  entriesModel: TEntriesModel,
  { id, extra }: UcMap.Schema.Options<TExtraModel> = {},
): UcMap.Schema<TEntriesModel, TExtraModel> {
  const entries: [string, UcSchema][] = Object.entries(entriesModel).map(([key, model]) => [
    key,
    ucSchema(model),
  ]);

  return {
    type: 'map',
    id: id ?? `map_${++UcMap$idSeq}`,
    with: UcMap$instructions,
    entries: Object.fromEntries(entries) as UcMap.Schema.Entries<TEntriesModel>,
    extra: (extra ? ucSchema(extra) : false) as UcMap.Schema<TEntriesModel, TExtraModel>['extra'],
    toString() {
      let out = '{';

      entries.every(([key, entry], i) => {
        if (i) {
          out += ', ';
        }
        out += jsPropertyKey(key) + ': ' + ucModelName(entry);

        if (i < 2) {
          return true;
        }

        out += ', ...';

        return false;
      });

      return out + '}';
    },
  };
}

let UcMap$idSeq = 0;

const UcMap$instructions: UcInstructions = {
  deserializer: {
    use: {
      from: COMPILER_MODULE,
      feature: 'MapUcrxTemplate',
    },
  },
  serializer: {
    use: {
      from: COMPILER_MODULE,
      feature: 'ucsSupportMap',
    },
  },
};
