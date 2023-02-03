import { asis } from '@proc7ts/primitives';
import { UcPrimitive } from './uc-primitive.js';
import { ucSchemaName } from './uc-schema-name.js';
import { UcSchema, UcSchema__symbol } from './uc-schema.js';
import { UcValue } from './uc-value.js';

/**
 * URI charge list represented as JavaScript array.
 *
 * @typeParam TValue - List item value type.
 */
export type UcList<TValue = UcPrimitive> = UcValue<TValue>[];

export namespace UcList {
  /**
   * URI charge schema definition for JavaScript {@link UcList array} serialized as list.
   *
   * @typeParam TItemSpec - Type of list item schema specifier.
   */
  export interface Schema<TItem, TItemSpec extends UcSchema.Spec<TItem> = UcSchema.Spec<TItem>>
    extends UcSchema<TItem[]> {
    readonly type: 'list';
    readonly item: UcSchema.Of<TItemSpec>;
  }

  export namespace Schema {
    /**
     * Schema specifier of URI charge list.
     *
     * @typeParam TItemSpec - Type of list item schema specifier.
     */
    export type Spec<TItem, TItemSpec extends UcSchema.Spec<TItem> = UcSchema.Spec<TItem>> =
      | Schema<TItem, TItemSpec>
      | Ref<TItem, TItemSpec>;

    /**
     * Reference to schema of URI charge list.
     *
     * @typeParam TItemSpec - Type of list item schema specifier.
     */
    export type Ref<
      TItem,
      TItemSpec extends UcSchema.Spec<TItem> = UcSchema.Spec<TItem>,
    > = UcSchema.Ref<TItem[], Schema<TItem, TItemSpec>>;
  }
}

/**
 * Creates a reference to URI charge schema for JavaScript {@link UcList array} serialized as list.
 *
 * @typeParam TItemSpec - Type of list item schema specifier.
 * @param itemSpec - List item schema specifier.
 *
 * @returns Reference to schema of URI charge list.
 */
export function UcList<TItem, TItemSpec extends UcSchema.Spec<TItem> = UcSchema.Spec<TItem>>(
  itemSpec: TItemSpec,
): UcList.Schema.Ref<TItem, TItemSpec> {
  return {
    [UcSchema__symbol]: resolver => {
      const item = resolver.schemaOf(itemSpec) as UcSchema.Of<TItemSpec>;

      return {
        type: 'list',
        item,
        asis,
        toString() {
          return `${ucSchemaName(item)}[]`;
        },
      };
    },
  };
}
