import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { UcInfer, UcModel } from '../../schema/uc-schema.js';

export interface UcdModels {
  readonly [reader: string]: UcdModels.Entry;
}

export function isUcdModelConfig<TModel extends UcModel>(
  entry: UcdModels.Entry<TModel>,
): entry is UcdModels.ModelConfig<TModel> {
  return Array.isArray(entry);
}

export namespace UcdModels {
  export type Entry<TModel extends UcModel = UcModel> = TModel | ModelConfig<TModel>;

  export type ModelConfig<
    TModel extends UcModel = UcModel,
    TMode extends UcDeserializer.Mode = UcDeserializer.Mode,
  > = readonly [TMode, TModel];

  export type ModeOf<TEntry extends Entry> = TEntry extends ModelConfig<any, infer TMode>
    ? TMode
    : 'universal';

  export type ModelOf<TEntry extends Entry> = TEntry extends ModelConfig<infer TModel, any>
    ? TModel
    : TEntry;
}

export type UcdExports<TModels extends UcdModels> = {
  readonly [reader in keyof TModels]: UcdModels.ModeOf<TModels[reader]> extends 'sync'
    ? UcDeserializer.Sync<UcInfer<UcdModels.ModelOf<TModels[reader]>>>
    : UcdModels.ModeOf<TModels[reader]> extends 'async'
    ? UcDeserializer.Async<UcInfer<UcdModels.ModelOf<TModels[reader]>>>
    : UcDeserializer<UcInfer<UcdModels.ModelOf<TModels[reader]>>>;
};
