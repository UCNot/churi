import { AsyncUcdReader } from './async-ucd-reader.js';
import { ucdExpectedTypes, ucdTypeNames, ucdUnexpectedTypeError } from './ucd-errors.js';
import { UcdItemRx, UcdRx } from './ucd-rx.js';

export function readUcList(
  reader: AsyncUcdReader,
  setList: (value: unknown) => void,
  createRx: (addItem: (value: unknown) => 1) => UcdRx,
  nullable:
    | 0
    | 1 /* nullable list, but not items */
    | 2 /* nullable items, but not list */
    | 3 /* nullable list and items */ = 0,
): UcdRx {
  let listCreated = false;
  const items: unknown[] | null = [];
  let isNull = false;

  const firstRx = createRx((item: unknown): 1 => {
    items.push(item);

    return 1;
  });

  const firstItemRx = firstRx._;
  let itemRx: UcdItemRx;

  if (firstRx.end) {
    // Nested list items expected.
    let firstItem = true;

    itemRx = {
      nls() {
        listCreated = true;

        if (firstItem) {
          // Reuse the first item receiver only once.
          firstItem = false;

          return firstRx;
        }

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

        reader.error(ucdUnexpectedTypeError('null', { _: errorRx }));
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
  } else if (nullable & 1) {
    // Nullable list, with possibly nullable single items.
    itemRx = {
      ...firstItemRx,
      nul: (): 1 => {
        if (!listCreated) {
          isNull = true;
        } else {
          isNull = false;
          if (!firstItemRx.nul?.()) {
            reader.error(ucdUnexpectedTypeError('null', firstRx));
          }
        }

        return 1;
      },
    };
  } else {
    // Nested single items expected.
    itemRx = firstItemRx;
  }

  return {
    _: itemRx,
    lst() {
      listCreated = true;

      return 1;
    },
    end() {
      if (isNull) {
        setList(null);
      } else if (listCreated) {
        setList(items);
      } else {
        const types = ucdExpectedTypes(firstRx);

        reader.error({
          code: 'unexpectedType',
          details: {
            types,
            expected: {
              types: ['list'],
            },
          },
          message: `Unexpected single ${ucdTypeNames(types)}, while list expected`,
        });
      }
    },
  };
}
