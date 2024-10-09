import { esQuoteKey } from 'esgen';
import { COMPILER_MODULE } from '../../impl/module-names.js';
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
  > =
    TExtraModel extends UcModel<any>
      ? /* This should be AND rather OR, but TypeScript (as of v5.1) does not support this properly. */
        | InferExplicit<TEntriesModel>
          | {
              [key in ExtraKeys<TEntriesModel>]?: UcInfer<TExtraModel>;
            }
      : InferExplicit<TEntriesModel>;

  /**
   * Type of object containing explicitly specified entries within {@link Schema map model}.
   *
   * Does not contain {@link ExtraOptions#extra extra entries}.
   *
   * @typeParam TEntriesModel - Per-entry model type.
   */
  export type InferExplicit<TEntriesModel extends EntriesModel> = {
    -readonly [key in RequiredKeys<TEntriesModel>]: UcInfer<TEntriesModel[key]>;
  } & {
    -readonly [key in OptionalKeys<TEntriesModel>]?: UcInfer<TEntriesModel[key]>;
  };

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

  // Does not work as expected (as of TypeScript v5.1)!
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
   * Variant of {@link UcMap map} schema.
   */
  export interface Variant {
    /**
     * How to handle duplicate entries of the map.
     *
     * Can be one of:
     *
     * - `'collect'` to collect duplicates into one value. It is a good idea to declared map entry schemas
     *   as {@link UcList lists} or {@link UcMultiValue multi-values}.
     * - `'overwrite'` (the default) to entry value each time it is received. The value specified the last takes
     *   precedence.
     * - `'reject'` to reject duplicate entries.
     */
    readonly duplicates?: 'collect' | 'overwrite' | 'reject' | undefined;
  }

  /**
   * Additional options for the {@link ucMap map schema}.
   *
   * @typeParam TEntriesModel - Per-entry model type.
   * @typeParam TExtraModel - Extra entries model type, or `false` to prohibit extra entries.
   */
  export interface BaseOptions<
    TEntriesModel extends EntriesModel,
    TExtraModel extends UcModel | false,
  > extends UcSchema.Extension<
        UcMap.Infer<TEntriesModel, TExtraModel>,
        UcMap.Schema<TEntriesModel, TExtraModel>
      >,
      Variant {}

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
  const { extra, duplicates } = options;
  const entries: [string, UcSchema][] = Object.entries(entriesModel).map(([key, model]) => [
    key,
    ucSchema(model),
  ]);
  const variant: UcMap.Variant = {
    duplicates,
  };

  return ucSchema<
    UcMap.Infer<TEntriesModel, TExtraModel>,
    UcMap.Schema<TEntriesModel, TExtraModel>
  >(
    {
      type: 'map',
      where: {
        deserializer: {
          use: 'MapUcrxClass',
          from: COMPILER_MODULE,
          with: variant,
          id: UcMap$id,
        },
        serializer: {
          use: 'ucsProcessMap',
          from: COMPILER_MODULE,
          id: UcMap$id,
        },
      },
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

function UcMap$id(
  this: { with: UcMap.Variant | undefined },
  { entries, extra }: UcMap.Schema,
  schemaId: (schema: UcSchema) => string,
): string {
  const entryIds = Object.entries(entries)
    .map(
      ([entryName, entryModel]) =>
        esQuoteKey(entryName) + '(' + schemaId(ucSchema(entryModel)) + ')',
    )
    .join(';');
  let id = `entries{${entryIds}}`;

  if (extra) {
    id += ',extra(' + schemaId(ucSchema(extra)) + ')';
  }

  const options = this.with;

  if (options) {
    const { duplicates = 'overwrite' } = options;

    id += `,duplicates:${duplicates}`;
  }

  return id;
}
