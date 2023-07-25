import { EsSnippet } from 'esgen';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { UcInfer, UcModel, UcSchema } from '../../schema/uc-schema.js';
import { UcrxInsetSignature } from '../rx/ucrx-inset-method.js';

export interface UcdModels {
  readonly [reader: string]: UcdModels.Entry;
}

export namespace UcdModels {
  export interface Entry<
    out TModel extends UcModel = UcModel,
    out TMode extends UcDeserializer.Mode = UcDeserializer.Mode,
  > {
    readonly model: TModel;
    readonly mode?: TMode | undefined;
    readonly inset?: ((this: void, args: UcrxInsetSignature.Values) => EsSnippet) | undefined;
  }

  export type ModeOf<TEntry extends Entry> = TEntry extends Entry<any, infer TMode>
    ? TMode
    : 'universal';

  export type ModelOf<TEntry extends Entry> = TEntry extends Entry<infer TModel, any>
    ? TModel
    : TEntry;

  export interface SchemaEntry<
    out T = unknown,
    out TSchema extends UcSchema<T> = UcSchema<T>,
    out TMode extends UcDeserializer.Mode = UcDeserializer.Mode,
  > extends Entry<TSchema, TMode> {}
}

export type UcdExports<TModels extends UcdModels> = {
  readonly [reader in keyof TModels]: UcdModels.ModeOf<TModels[reader]> extends 'sync'
    ? UcDeserializer.Sync<UcInfer<UcdModels.ModelOf<TModels[reader]>>>
    : UcdModels.ModeOf<TModels[reader]> extends 'async'
    ? UcDeserializer.Async<UcInfer<UcdModels.ModelOf<TModels[reader]>>>
    : UcDeserializer<UcInfer<UcdModels.ModelOf<TModels[reader]>>>;
};
