import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcConstraints } from '../uc-constraints.js';
import { ucModelName } from '../uc-model-name.js';
import { UcModel, UcSchema, ucSchema } from '../uc-schema.js';

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
  export interface Schema<
    out TItem = unknown,
    out TItemModel extends UcModel<TItem> = UcModel<TItem>,
  > extends UcSchema<TItem[]> {
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
    export type Options<
      TItem = unknown,
      TItemModel extends UcModel<TItem> = UcModel<TItem>,
    > = UcSchema.Extension<TItem[], Schema<TItem, TItemModel>>;
  }
}

/**
 * Creates data schema for JavaScript {@link UcList array} serialized as list.
 *
 * @typeParam TItemModel - Type of list item model.
 * @param itemModel - List item model.
 *
 * @returns New list schema instance.
 */
export function ucList<TItem, TItemModel extends UcModel<TItem> = UcModel<TItem>>(
  itemModel: TItemModel,
  options?: UcList.Schema.Options<TItem, TItemModel>,
): UcList.Schema<TItem, TItemModel>;

/*#__NO_SIDE_EFFECTS__*/
export function ucList<TItem, TItemSchema extends UcSchema<TItem> = UcSchema<TItem>>(
  itemModel: UcModel<TItem, TItemSchema>,
  options: UcList.Schema.Options<TItem, TItemSchema> = {},
): UcList.Schema<TItem, TItemSchema> {
  const item = ucSchema<TItem, TItemSchema>(itemModel) as UcSchema.Of<TItemSchema>;

  return ucSchema<TItem[], UcList.Schema<TItem, TItemSchema>>(
    {
      type: 'list',
      where: UcList$constraints,
      item,
      toString() {
        return `${ucModelName(item)}[]`;
      },
    },
    options,
  );
}

const UcList$constraints: UcConstraints<never[], UcList.Schema<never>> = {
  deserializer: {
    use: 'ListUcrxClass',
    from: COMPILER_MODULE,
  },
  serializer: {
    use: 'ucsSupportList',
    from: COMPILER_MODULE,
  },
};
