import { UccListOptions } from '../../compiler/common/ucc-list-options.js';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { ucModelName } from '../uc-model-name.js';
import { UcModel, UcSchema, ucSchema } from '../uc-schema.js';
import { UcList } from './uc-list.js';
import { UcMultiValue } from './uc-multi-value.js';

export function createUcListSchema<TItem, TItemSchema extends UcSchema<TItem> = UcSchema<TItem>>(
  itemModel: UcModel<TItem, TItemSchema>,
  options: UcList.Options<TItem, TItemSchema> & UccListOptions,
): UcList.Schema<TItem, TItemSchema>;

export function createUcListSchema<TItem, TItemSchema extends UcSchema<TItem> = UcSchema<TItem>>(
  itemModel: UcModel<TItem, TItemSchema>,
  options: UcMultiValue.Options<TItem, TItemSchema> & UccListOptions,
): UcMultiValue.Schema<TItem, TItemSchema>;

export function createUcListSchema<TItem, TItemSchema extends UcSchema<TItem> = UcSchema<TItem>>(
  itemModel: UcModel<TItem, TItemSchema>,
  options: (UcList.Options<TItem, TItemSchema> | UcMultiValue.Options<TItem, TItemSchema>) &
    UccListOptions,
): UcMultiValue.Schema<TItem, TItemSchema> {
  const item = ucSchema<TItem, TItemSchema>(itemModel) as UcSchema.Of<TItemSchema>;

  return ucSchema<TItem | TItem[], UcMultiValue.Schema<TItem, TItemSchema>>(
    {
      type: 'list',
      where: {
        deserializer: {
          use: 'ListUcrxClass',
          from: COMPILER_MODULE,
          with: options,
        },
        serializer: {
          use: 'ucsSupportList',
          from: COMPILER_MODULE,
          with: options,
        },
      },
      item,
      toString() {
        return `${ucModelName(item)}[]`;
      },
    },
    options,
  );
}
