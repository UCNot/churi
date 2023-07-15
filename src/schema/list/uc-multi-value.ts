import { UcModel, UcSchema } from '../uc-schema.js';
import { createUcListSchema } from './uc-list.impl.js';

/**
 * Multi-value is a data represented either as JavaScript array, or as a single value.
 *
 * @typeParam TItem - Type of single item.
 */
export type UcMultiValue<TItem = unknown> = TItem | TItem[];

export namespace UcMultiValue {
  /**
   * Schema definition for {@link UcMultiValue multi-value} serialized as list or single value.
   *
   * Such schema can be built with {@link ucMultiValue} function.
   *
   * @typeParam TItem - Type of single item.
   * @typeParam TItemModel - Type of single item model.
   */
  export interface Schema<
    out TItem = unknown,
    out TItemModel extends UcModel<TItem> = UcModel<TItem>,
  > extends UcSchema<TItem | TItem[]> {
    readonly type: 'list';

    /**
     * Single item schema.
     */
    readonly item: UcSchema.Of<TItemModel>;
  }

  /**
   * Additional options for the {@link ucMultiValue multi-value schema}.
   *
   * @typeParam TItem - Type of single item.
   * @typeParam TItemModel - Type of single item model.
   */
  export interface Options<TItem = unknown, TItemModel extends UcModel<TItem> = UcModel<TItem>>
    extends UcSchema.Extension<TItem | TItem[], Schema<TItem, TItemModel>> {
    /**
     * How to treat single values.
     *
     * One of:
     *
     * `'as-is'` (the default) to treat a single value as is and not convert it to array.
     * `'prefer'` to treat an array with single item as single value.
     *
     * This option is ignored if single item type is a list itself.
     */
    readonly single?: 'as-is' | 'prefer' | undefined;
  }
}

/**
 * Creates data schema for {@link UcMultiValue multi-value} serialized as list or single value.
 *
 * @typeParam TItem - Type of single item.
 * @typeParam TItemModel - Type of single item model.
 * @param itemModel - Single item model.
 *
 * @returns New list schema instance.
 */
export function ucMultiValue<TItem, TItemModel extends UcSchema<TItem> = UcSchema<TItem>>(
  itemModel: TItemModel,
  options?: UcMultiValue.Options<TItem, TItemModel>,
): UcMultiValue.Schema<TItem, TItemModel>;

/*#__NO_SIDE_EFFECTS__*/
export function ucMultiValue<TItem, TItemSchema extends UcSchema<TItem> = UcSchema<TItem>>(
  itemModel: UcModel<TItem, TItemSchema>,
  options: UcMultiValue.Options<TItem, TItemSchema> = {},
): UcMultiValue.Schema<TItem, TItemSchema> {
  const { single = 'as-is' } = options;

  return createUcListSchema(itemModel, { ...options, single });
}
