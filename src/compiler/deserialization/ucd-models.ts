import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { UcInfer, UcModel, UcSchema } from '../../schema/uc-schema.js';

export interface UcdModels {
  readonly [reader: string]: UcdModels.Entry;
}

export namespace UcdModels {
  export interface BaseEntry<out TModel extends UcModel = UcModel> {
    readonly model: TModel;
    readonly mode?: UcDeserializer.Mode | undefined;
  }

  export type Entry<TModel extends UcModel = UcModel> =
    | SyncEntry<TModel>
    | AsyncByTokensEntry<TModel>
    | ByTokensEntry<TModel>
    | AsyncEntry<TModel>
    | UniversalEntry<TModel>;

  export interface SyncEntry<out TModel extends UcModel = UcModel> extends BaseEntry<TModel> {
    readonly mode: 'sync';
    readonly byTokens?: boolean | undefined;
  }

  export interface AsyncByTokensEntry<out TModel extends UcModel = UcModel>
    extends BaseEntry<TModel> {
    readonly mode: 'async';
    readonly byTokens: true;
  }

  export interface AsyncEntry<out TModel extends UcModel = UcModel> extends BaseEntry<TModel> {
    readonly mode: 'async';
    readonly byTokens?: false | undefined;
  }

  export interface ByTokensEntry<out TModel extends UcModel = UcModel> extends BaseEntry<TModel> {
    readonly mode?: 'universal' | undefined;
    readonly byTokens: true;
  }

  export interface UniversalEntry<out TModel extends UcModel = UcModel> extends BaseEntry<TModel> {
    readonly mode?: 'universal' | undefined;
    readonly byTokens?: false | undefined;
  }

  export type ModelOf<TEntry extends Entry> = TEntry extends Entry<infer TModel> ? TModel : never;

  export type SchemaEntry<T = unknown, TSchema extends UcSchema<T> = UcSchema<T>> = Entry<TSchema>;
}

export type UcdExports<TModels extends UcdModels> = {
  readonly [reader in keyof TModels]: TModels[reader] extends UcdModels.SyncEntry<any>
    ? UcDeserializer.Sync<UcInfer<UcdModels.ModelOf<TModels[reader]>>>
    : TModels[reader] extends UcdModels.AsyncByTokensEntry<any>
    ? UcDeserializer.AsyncByTokens<UcInfer<UcdModels.ModelOf<TModels[reader]>>>
    : TModels[reader] extends UcdModels.AsyncEntry<any>
    ? UcDeserializer.Async<UcInfer<UcdModels.ModelOf<TModels[reader]>>>
    : TModels[reader] extends UcdModels.ByTokensEntry<any>
    ? UcDeserializer.ByTokens<UcInfer<UcdModels.ModelOf<TModels[reader]>>>
    : UcDeserializer<UcInfer<UcdModels.ModelOf<TModels[reader]>>>;
};
