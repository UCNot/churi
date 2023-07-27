import { UcFormatName } from '../../schema/uc-presentations.js';
import { UcInfer, UcModel } from '../../schema/uc-schema.js';
import { UcSerializer } from '../../schema/uc-serializer.js';

export interface UcsModels {
  readonly [writer: string]: UcsModels.Entry;
}

export namespace UcsModels {
  export interface Entry<out TModel extends UcModel = UcModel> {
    readonly model: TModel;
    readonly format?: UcFormatName | undefined;
  }

  export type ModelOf<TEntry extends Entry> = TEntry extends Entry<infer TModel> ? TModel : never;
}

export type UcsExports<out TModels extends UcsModels> = {
  readonly [writer in keyof TModels]: UcSerializer<UcInfer<UcsModels.ModelOf<TModels[writer]>>>;
};
