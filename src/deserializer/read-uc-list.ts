import { AsyncUcdReader } from './async-ucd-reader.js';
import { ucdExpectedTypes, ucdTypeNames, ucdUnexpectedTypeError } from './ucd-errors.js';
import { UcdRx, UcdValueRx } from './ucd-rx.js';

export function readUcList(
  reader: AsyncUcdReader,
  setList: (value: unknown) => void,
  createItemRx: (addItem: (value: unknown) => 1) => UcdRx,
  nullable:
    | 0
    | 1 /* nullable list, but not items */
    | 2 /* nullable items, but not list */
    | 3 /* nullable list and items */ = 0,
): UcdRx {
  let listCreated = false;
  const items: unknown[] | null = [];
  let isNull = false;

  const firstItemRx = createItemRx((item: unknown): 1 => {
    items.push(item);

    return 1;
  });

  const firstItemValueRx = firstItemRx._;
  let valueRx: UcdValueRx;

  if (firstItemRx.end) {
    // Nested list items expected.
    let firstItem = true;

    valueRx = {
      nls() {
        listCreated = true;

        if (firstItem) {
          // Reuse the first item receiver only once.
          firstItem = false;

          return firstItemRx;
        }

        return createItemRx((item: unknown): 1 => {
          items.push(item);

          return 1;
        });
      },
    };

    if (nullable) {
      const rejectNullItem = (): void => {
        const errorRx = { ...valueRx };

        delete errorRx.nul;

        reader.error(ucdUnexpectedTypeError('null', { _: errorRx }));
      };

      valueRx.nul = () => {
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
    valueRx = {
      ...firstItemValueRx,
      nul: (): 1 => {
        if (!listCreated) {
          isNull = true;
        } else {
          isNull = false;
          if (!firstItemValueRx.nul?.()) {
            reader.error(ucdUnexpectedTypeError('null', firstItemRx));
          }
        }

        return 1;
      },
    };
  } else {
    // Nested single items expected.
    valueRx = firstItemValueRx;
  }

  return {
    _: valueRx,
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
        const types = ucdExpectedTypes(firstItemRx);

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
