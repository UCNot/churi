import { UcModel, UcSchema } from '../uc-schema.js';
import { createUcListSchema } from './uc-list.impl.js';

/**
 * Data list represented as JavaScript array.
 *
 * @typeParam TItem - Type of list item.
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

  /**
   * Additional options for the {@link ucList list schema}.
   *
   * @typeParam TItem - Type of list item.
   * @typeParam TItemModel - Type of list item model.
   */
  export interface Options<TItem = unknown, TItemModel extends UcModel<TItem> = UcModel<TItem>>
    extends UcSchema.Extension<TItem[], Schema<TItem, TItemModel>> {
    /**
     * How to treat single values.
     *
     * One of:
     *
     * `'accept'` to treat single value as list with single item.
     * `'reject'` (the default) to reject single value.
     *
     * This option is ignored if item type is a list itself.
     */
    readonly single?: 'accept' | 'reject' | undefined;
  }
}

/**
 * Creates data schema for JavaScript {@link UcList array} serialized as list.
 *
 * @typeParam TItem - Type of list item.
 * @typeParam TItemModel - Type of list item model.
 * @param itemModel - List item model.
 * @param options
 *
 * @returns New list schema instance.
 */
export function ucList<TItem, TItemModel extends UcModel<TItem> = UcModel<TItem>>(
  itemModel: TItemModel,
  options?: UcList.Options<TItem, TItemModel>,
): UcList.Schema<TItem, TItemModel>;

/*#__NO_SIDE_EFFECTS__*/
export function ucList<TItem, TItemSchema extends UcSchema<TItem> = UcSchema<TItem>>(
  itemModel: UcModel<TItem, TItemSchema>,
  options: UcList.Options<TItem, TItemSchema> = {},
): UcList.Schema<TItem, TItemSchema> {
  const { single = 'reject' } = options;

  return createUcListSchema(itemModel, { ...options, single });
}
