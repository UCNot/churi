import { ucrxUnexpectedSingleItem, ucrxUnexpectedTypeError } from '../rx/ucrx-errors.js';
import { Ucrx, UcrxList } from '../rx/ucrx.js';
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
): UcrxList {
  let listCreated = false;
  const items: unknown[] | null = [];
  let isNull = false;

  const itemRx = createRx((item: unknown): 1 => {
    items.push(item);

    return 1;
  });

  const listRx: UcrxList = {
    ...itemRx,
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
        reader.error(ucrxUnexpectedSingleItem(itemRx));
      }
    },
  };

  if (nullable & 1) {
    // Nullable list, with possibly nullable single items.
    listRx.nul = (): 1 => {
      if (!listCreated) {
        isNull = true;
      } else {
        isNull = false;
        if (!itemRx.nul?.()) {
          reader.error(ucrxUnexpectedTypeError('null', itemRx));
        }
      }

      return 1;
    };
  }

  return listRx;
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
): UcrxList {
  let listCreated = false;
  const items: unknown[] | null = [];
  let isNull = false;

  const listRx: UcrxList = {
    nls() {
      listCreated = true;

      return createRx((item: unknown): 1 => {
        items.push(item);

        return 1;
      });
    },
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

  if (nullable) {
    const rejectNullItem = (): void => {
      const errorRx: Ucrx = { ...listRx };

      delete errorRx.nul;
      delete errorRx.ls;

      reader.error(ucrxUnexpectedTypeError('null', errorRx));
    };

    listRx.nul = () => {
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

  return listRx;
}
