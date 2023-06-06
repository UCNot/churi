import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcInstructions } from '../uc-instructions.js';
import { ucModelName } from '../uc-model-name.js';
import { UcDataType, UcModel, UcSchema, ucSchema } from '../uc-schema.js';

/**
 * URI charge list represented as JavaScript array.
 *
 * @typeParam TItem - List item value type.
 */
export type UcList<TItem = unknown> = TItem[];

export namespace UcList {
  /**
   * Schema definition for JavaScript {@link UcList array} serialized as list.
   *
   * Such schema can be built with {@link ucList} function.
   *
   * @typeParam TItem - Type of list item.
   * @typeParam TItemModel - Type of list item model.
   */
  export interface Schema<TItem = unknown, TItemModel extends UcModel<TItem> = UcModel<TItem>>
    extends UcSchema<TItem[]> {
    readonly type: 'list';

    /**
     * List item schema.
     */
    readonly item: UcSchema.Of<TItemModel>;
  }

  export namespace Schema {
    /**
     * Additional options for the {@link ucList list schema}.
     */
    export interface Options {
      /**
       * Unique schema identifier.
       *
       * @defaultValue Autogenerated string.
       */
      readonly id?: string | UcDataType | undefined;
    }
  }
}

/**
 * Creates a reference to URI charge schema for JavaScript {@link UcList array} serialized as list.
 *
 * @typeParam TItemModel - Type of list item model.
 * @param itemModel - List item model.
 *
 * @returns New list schema instance.
 */
export function ucList<TItem, TItemModel extends UcModel<TItem> = UcModel<TItem>>(
  itemModel: TItemModel,
  options?: UcList.Schema.Options,
): UcList.Schema<TItem, TItemModel>;

export function ucList<TItem, TItemSchema extends UcSchema<TItem> = UcSchema<TItem>>(
  itemModel: UcModel<TItem, TItemSchema>,
  { id }: UcList.Schema.Options = {},
): UcList.Schema<TItem, TItemSchema> {
  const item = ucSchema<TItem, TItemSchema>(itemModel) as UcSchema.Of<TItemSchema>;

  return {
    type: 'list',
    id: id ?? `list_${++UcList$idSeq}`,
    with: UcList$instructions,
    item,
    toString() {
      return `${ucModelName(item)}[]`;
    },
  };
}

let UcList$idSeq = 0;

const UcList$instructions: UcInstructions = {
  deserializer: {
    use: {
      from: COMPILER_MODULE,
      feature: 'ListUcrxClass',
    },
  },
  serializer: {
    use: {
      from: COMPILER_MODULE,
      feature: 'ucsSupportList',
    },
  },
};
