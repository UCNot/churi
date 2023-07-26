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
    | UniversalEntry<TModel>
    | AsyncLexerEntry<TModel>
    | LexerEntry<TModel>;

  export interface SyncEntry<out TModel extends UcModel = UcModel> extends BaseEntry<TModel> {
    readonly mode: 'sync';
    readonly lexer?: ((this: void, args: { emit: EsSnippet }) => EsSnippet) | undefined;
  }

  export interface AsyncEntry<out TModel extends UcModel = UcModel> extends BaseEntry<TModel> {
    readonly mode: 'async';
    readonly lexer?: undefined;
  }

  export interface AsyncLexerEntry<out TModel extends UcModel = UcModel> extends BaseEntry<TModel> {
    readonly mode: 'async';
    readonly lexer: (this: void, args: { emit: EsSnippet }) => EsSnippet;
  }

  export interface UniversalEntry<out TModel extends UcModel = UcModel> extends BaseEntry<TModel> {
    readonly mode?: 'universal' | undefined;
    readonly lexer?: undefined;
  }

  export interface LexerEntry<out TModel extends UcModel = UcModel> extends BaseEntry<TModel> {
    readonly mode?: 'universal' | undefined;
    readonly lexer: (this: void, args: { emit: EsSnippet }) => EsSnippet;
  }

  export type ModelOf<TEntry extends Entry> = TEntry extends Entry<infer TModel> ? TModel : never;

  export type SchemaEntry<T = unknown, TSchema extends UcSchema<T> = UcSchema<T>> = Entry<TSchema>;
}

export type UcdExports<TModels extends UcdModels> = {
  readonly [reader in keyof TModels]: TModels[reader] extends UcdModels.SyncEntry<any>
    ? UcDeserializer.Sync<UcInfer<UcdModels.ModelOf<TModels[reader]>>>
    : TModels[reader] extends UcdModels.AsyncEntry<any>
    ? UcDeserializer.AsyncByTokens<UcInfer<UcdModels.ModelOf<TModels[reader]>>>
    : TModels[reader] extends UcdModels.AsyncLexerEntry<any>
    ? UcDeserializer.Async<UcInfer<UcdModels.ModelOf<TModels[reader]>>>
    : TModels[reader] extends UcdModels.UniversalEntry<any>
    ? UcDeserializer.ByTokens<UcInfer<UcdModels.ModelOf<TModels[reader]>>>
    : UcDeserializer<UcInfer<UcdModels.ModelOf<TModels[reader]>>>;
};
