import { EsSnippet } from 'esgen';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { UcInfer, UcModel, UcSchema } from '../../schema/uc-schema.js';
import { UcrxInsetSignature } from '../rx/ucrx-inset-method.js';

export interface UcdModels {
  readonly [reader: string]: UcdModels.Entry;
}

export namespace UcdModels {
  export interface BaseEntry<out TModel extends UcModel = UcModel> {
    readonly model: TModel;
    readonly mode?: UcDeserializer.Mode | undefined;
    readonly inset?: ((this: void, args: UcrxInsetSignature.Values) => EsSnippet) | undefined;
  }

  export type Entry<TModel extends UcModel = UcModel> =
    | SyncEntry<TModel>
    | AsyncEntry<TModel>
    | UniversalEntry<TModel>;

  export interface SyncEntry<out TModel extends UcModel = UcModel> extends BaseEntry<TModel> {
    readonly mode: 'sync';
  }

  export interface AsyncEntry<out TModel extends UcModel = UcModel> extends BaseEntry<TModel> {
    readonly mode: 'async';
  }

  export interface UniversalEntry<out TModel extends UcModel = UcModel> extends BaseEntry<TModel> {
    readonly mode?: 'universal' | undefined;
  }

  export type ModeOf<TEntry extends Entry> = TEntry extends { readonly mode: infer TMode }
    ? TMode
    : 'universal';

  export type ModelOf<TEntry extends Entry> = TEntry extends Entry<infer TModel> ? TModel : never;

  export type SchemaEntry<T = unknown, TSchema extends UcSchema<T> = UcSchema<T>> = Entry<TSchema>;
}

export type UcdExports<TModels extends UcdModels> = {
  readonly [reader in keyof TModels]: UcdModels.ModeOf<TModels[reader]> extends 'sync'
    ? UcDeserializer.Sync<UcInfer<UcdModels.ModelOf<TModels[reader]>>>
    : UcdModels.ModeOf<TModels[reader]> extends 'async'
    ? UcDeserializer.Async<UcInfer<UcdModels.ModelOf<TModels[reader]>>>
    : UcDeserializer<UcInfer<UcdModels.ModelOf<TModels[reader]>>>;
};
