import { ucdExpectedTypes } from './impl/ucd-errors.js';
import { UcdReader } from './ucd-reader.js';
import { UcdRx, UcdValueRx } from './ucd-rx.js';

export function readUcList(
  reader: UcdReader,
  setList: (value: unknown) => void,
  createItemRx: (addItem: (value: unknown) => 1) => UcdRx,
): { rx: UcdRx; end: () => void } {
  let listCreated = false;
  const items: unknown[] = [];

  const firstItemRx = createItemRx((item: unknown): 1 => {
    items.push(item);

    return 1;
  });

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
  } else {
    // Nested single items expected.
    valueRx = firstItemRx._;
  }

  return {
    rx: {
      _: valueRx,
      lst() {
        listCreated = true;

        return 1;
      },
      end() {
        setList(items);
      },
    },
    end() {
      if (!listCreated) {
        if (items.length) {
          const [type] = ucdExpectedTypes(firstItemRx);

          reader.error({
            code: 'unexpected',
            unexpected: {
              type,
              expected: ['list'],
            },
            message: `Unexpected single ${type}, while expected list`,
          });
        } else {
          reader.error({
            code: 'missing',
            missing: {
              expected: ['list'],
            },
            message: `Missing list`,
          });
        }
      }
    },
  };
}
