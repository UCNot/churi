import { esQuoteKey } from 'esgen';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcConstraints } from '../uc-constraints.js';
import { ucModelName } from '../uc-model-name.js';
import { UcInfer, UcModel, UcSchema, ucSchema } from '../uc-schema.js';

/**
 * Data map represented as JavaScript object.
 */
export interface UcMap {
  [key: PropertyKey]: unknown;
}

export namespace UcMap {
  /**
   * Data schema definition for JavaScript {@link UcMap object} serialized as map.
   *
   * Such schema can be built with {@link ucMap} function.
   *
   * @typeParam TEntriesModel - Per-entry model type.
   * @typeParam TExtraModel - Extra entries model type, or `false` to prohibit extra entries.
   */
  export interface Schema<
    in out TEntriesModel extends EntriesModel = EntriesModel,
    out TExtraModel extends UcModel | false = false,
  > extends UcSchema<Infer<TEntriesModel, TExtraModel>> {
    readonly type: 'map';
    readonly entries: Entries<TEntriesModel>;
    readonly extra: TExtraModel extends UcModel ? UcSchema.Of<TExtraModel> : false;
  }

  /**
   * Type of object inferred from the {@link Schema map model}.
   *
   * @typeParam TEntriesModel - Per-entry model type.
   * @typeParam TExtraModel - Extra entries model type, or `false` to prohibit extra entries.
   */
  export type Infer<
    TEntriesModel extends EntriesModel,
    TExtraModel extends UcModel | false = false,
  > = {
    -readonly [key in RequiredKeys<TEntriesModel>]: UcInfer<TEntriesModel[key]>;
  } & {
    -readonly [key in OptionalKeys<TEntriesModel>]?: UcInfer<TEntriesModel[key]>;
  } & (TExtraModel extends UcModel<any>
      ? { [key in Exclude<string, keyof TEntriesModel>]: UcInfer<TExtraModel> }
      : { [key in never]: never });

  export type Required<
    TEntriesModel extends EntriesModel,
    TKey extends keyof TEntriesModel = keyof TEntriesModel,
  > = undefined extends UcInfer<TEntriesModel[TKey]> ? TKey : never;

  export type RequiredKeys<
    TEntriesModel extends EntriesModel,
    TKey extends keyof TEntriesModel = keyof TEntriesModel,
  > = undefined extends UcInfer<TEntriesModel[TKey]> ? never : TKey;

  export type OptionalKeys<
    TEntriesModel extends EntriesModel,
    TKey extends keyof TEntriesModel = keyof TEntriesModel,
  > = undefined extends UcInfer<TEntriesModel[TKey]> ? TKey : never;

  export type ExtraKeys<TEntriesModel extends EntriesModel> = Exclude<string, keyof TEntriesModel>;

  /**
   * Per-entry schema of URI charge map.
   *
   * @typeParam TEntriesModel - Per-entry model type.
   */
  export type Entries<TEntriesModel extends EntriesModel> = {
    readonly [key in keyof TEntriesModel]: UcSchema.Of<TEntriesModel[key]>;
  };

  /**
   * Per-entry model of the map.
   *
   * Each property corresponds to a map entry with data type implied by corresponding model.
   */
  export type EntriesModel = {
    readonly [key in string]: UcModel;
  };

  /**
   * Additional options for the {@link ucMap map schema}.
   *
   * @typeParam TEntriesModel - Per-entry model type.
   * @typeParam TExtraModel - Extra entries model type, or `false` to prohibit extra entries.
   */
  export type BaseOptions<
    TEntriesModel extends EntriesModel,
    TExtraModel extends UcModel | false,
  > = UcSchema.Extension<
    UcMap.Infer<TEntriesModel, TExtraModel>,
    UcMap.Schema<TEntriesModel, TExtraModel>
  >;

  export type Options<TEntriesModel extends EntriesModel, TExtraModel extends UcModel> =
    | ExactOptions<TEntriesModel>
    | ExtraOptions<TEntriesModel, TExtraModel>;

  export interface ExactOptions<in out TEntriesModel extends EntriesModel = EntriesModel>
    extends BaseOptions<TEntriesModel, false> {
    readonly extra?: false | undefined;
  }

  export interface ExtraOptions<
    in out TEntriesModel extends EntriesModel,
    out TExtraModel extends UcModel,
  > extends BaseOptions<TEntriesModel, TExtraModel> {
    readonly extra: TExtraModel;
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
export function ucMap<TEntriesModel extends UcMap.EntriesModel>(
  entries: TEntriesModel,
  options?: UcMap.ExactOptions,
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
export function ucMap<TEntriesModel extends UcMap.EntriesModel, TExtraModel extends UcModel>(
  entries: TEntriesModel,
  options: UcMap.ExtraOptions<TEntriesModel, TExtraModel>,
): UcMap.Schema<TEntriesModel, TExtraModel>;

/*#__NO_SIDE_EFFECTS__*/
export function ucMap<TEntriesModel extends UcMap.EntriesModel, TExtraModel extends UcModel>(
  entriesModel: TEntriesModel,
  options: UcMap.Options<TEntriesModel, TExtraModel> = {},
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
      where: UcMap$constraints,
      entries: Object.fromEntries(entries) as UcMap.Entries<TEntriesModel>,
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

const UcMap$constraints: UcConstraints<any, any> = {
  deserializer: {
    use: 'MapUcrxClass',
    from: COMPILER_MODULE,
  },
  serializer: {
    use: 'ucsSupportMap',
    from: COMPILER_MODULE,
  },
};
