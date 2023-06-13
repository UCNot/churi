import { esQuoteKey } from 'esgen';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcInstructions } from '../uc-instructions.js';
import { ucModelName } from '../uc-model-name.js';
import { UcInfer, UcModel, UcSchema, ucSchema } from '../uc-schema.js';

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
    in out TEntriesModel extends Schema.Entries.Model = Schema.Entries.Model,
    out TExtraModel extends UcModel | false = false,
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
     *
     * @typeParam TEntriesModel - Per-entry model type.
     * @typeParam TExtraModel - Extra entries model type, or `false` to prohibit extra entries.
     */
    export type BaseOptions<
      TEntriesModel extends Schema.Entries.Model,
      TExtraModel extends UcModel | false,
    > = UcSchema.Extension<
      UcMap.Infer<TEntriesModel, TExtraModel>,
      UcMap.Schema<TEntriesModel, TExtraModel>
    >;

    export type Options<TEntriesModel extends Schema.Entries.Model, TExtraModel extends UcModel> =
      | ExactOptions<TEntriesModel>
      | ExtraOptions<TEntriesModel, TExtraModel>;

    export interface ExactOptions<
      in out TEntriesModel extends Schema.Entries.Model = Schema.Entries.Model,
    > extends BaseOptions<TEntriesModel, false> {
      readonly extra?: false | undefined;
    }

    export interface ExtraOptions<
      in out TEntriesModel extends Schema.Entries.Model,
      out TExtraModel extends UcModel,
    > extends BaseOptions<TEntriesModel, TExtraModel> {
      readonly extra: TExtraModel;
    }
  }
}

/**
 * Creates data schema for JavaScript {@link UcMap object} serialized as map.
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

/**
 * Creates data schema for JavaScript {@link UcMap object} serialized as map with extra properties.
 *
 * @typeParam TEntriesModel - Per-entry model type.
 * @param entries - Per-entry model.
 * @param options - Schema options.
 *
 * @returns New map schema.
 */
export function ucMap<
  TEntriesModel extends UcMap.Schema.Entries.Model,
  TExtraModel extends UcModel,
>(
  entries: TEntriesModel,
  options: UcMap.Schema.ExtraOptions<TEntriesModel, TExtraModel>,
): UcMap.Schema<TEntriesModel, TExtraModel>;

/*#__NO_SIDE_EFFECTS__*/
export function ucMap<
  TEntriesModel extends UcMap.Schema.Entries.Model,
  TExtraModel extends UcModel,
>(
  entriesModel: TEntriesModel,
  options: UcMap.Schema.Options<TEntriesModel, TExtraModel> = {},
): UcMap.Schema<TEntriesModel, TExtraModel> {
  const { extra } = options;
  const entries: [string, UcSchema][] = Object.entries(entriesModel).map(([key, model]) => [
    key,
    ucSchema(model),
  ]);

  return ucSchema<
    UcMap.Infer<TEntriesModel, TExtraModel>,
    UcMap.Schema<TEntriesModel, TExtraModel>
  >(
    {
      type: 'map',
      with: UcMap$instructions,
      entries: Object.fromEntries(entries) as UcMap.Schema.Entries<TEntriesModel>,
      extra: (extra ? ucSchema(extra) : false) as UcMap.Schema<TEntriesModel, TExtraModel>['extra'],
      toString() {
        let out = '{';

        entries.every(([key, entry], i) => {
          if (i) {
            out += ', ';
          }
          out += esQuoteKey(key) + ': ' + ucModelName(entry);

          if (i < 2) {
            return true;
          }

          out += ', ...';

          return false;
        });

        return out + '}';
      },
    },
    options as
      | UcSchema.Extension<
          UcMap.Infer<TEntriesModel, TExtraModel>,
          UcMap.Schema<TEntriesModel, TExtraModel>
        >
      | undefined,
  );
}

const UcMap$instructions: UcInstructions<any, any> = {
  deserializer: {
    use: {
      from: COMPILER_MODULE,
      feature: 'MapUcrxClass',
    },
  },
  serializer: {
    use: {
      from: COMPILER_MODULE,
      feature: 'ucsSupportMap',
    },
  },
};
