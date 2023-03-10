import { ucrxUnexpectedSingleItem, ucrxUnexpectedTypeError } from '../rx/ucrx-errors.js';
import { Ucrx, UcrxItem, UcrxList } from '../rx/ucrx.js';
import { AsyncUcdReader } from './async-ucd-reader.js';

export function readUcList(
  reader: AsyncUcdReader,
  setList: (value: unknown) => void,
  createRx: (addItem: (value: unknown) => 1) => Ucrx,
  nullable:
    | 0
    | 1 /* nullable list, but not items */
    | 2 /* nullable items, but not list */
    | 3 /* nullable list and items */ = 0,
): Ucrx {
  let listCreated = false;
  const items: unknown[] | null = [];
  let isNull = false;

  const firstRx = createRx((item: unknown): 1 => {
    items.push(item);

    return 1;
  });

  const firstItemRx = firstRx._;
  let itemRx: UcrxItem;

  if (nullable & 1) {
    // Nullable list, with possibly nullable single items.
    itemRx = {
      ...firstItemRx,
      nul: (): 1 => {
        if (!listCreated) {
          isNull = true;
        } else {
          isNull = false;
          if (!firstItemRx.nul?.()) {
            reader.error(ucrxUnexpectedTypeError('null', firstRx));
          }
        }

        return 1;
      },
    };
  } else {
    itemRx = firstItemRx;
  }

  return {
    _: itemRx,
    em() {
      listCreated = true;

      return 1;
    },
    ls() {
      if (isNull) {
        setList(null);
      } else if (listCreated) {
        setList(items);
      } else {
        reader.error(ucrxUnexpectedSingleItem(firstRx));
      }
    },
  };
}

export function readUcMatrix(
  reader: AsyncUcdReader,
  setList: (value: unknown) => void,
  createRx: (addItem: (value: unknown) => 1) => UcrxList,
  nullable:
    | 0
    | 1 /* nullable list, but not items */
    | 2 /* nullable items, but not list */
    | 3 /* nullable list and items */ = 0,
): Ucrx {
  let listCreated = false;
  const items: unknown[] | null = [];
  let isNull = false;

  const itemRx: UcrxItem = {
    nls() {
      listCreated = true;

      return createRx((item: unknown): 1 => {
        items.push(item);

        return 1;
      });
    },
  };

  if (nullable) {
    const rejectNullItem = (): void => {
      const errorRx = { ...itemRx };

      delete errorRx.nul;

      reader.error(ucrxUnexpectedTypeError('null', { _: errorRx }));
    };

    itemRx.nul = () => {
      if (listCreated) {
        isNull = false;
        if (nullable & 2) {
          items.push(null);
        } else {
          rejectNullItem();
        }
      } else if (nullable & 1) {
        isNull = true;
      } else {
        rejectNullItem();
      }

      return 1;
    };
  }

  return {
    _: itemRx,
    em() {
      listCreated = true;

      return 1;
    },
    ls() {
      if (isNull) {
        setList(null);
      } else if (listCreated) {
        setList(items);
      }
      // No need to report missing items, as type mismatch already reported.
    },
  };
}
