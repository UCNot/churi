import { noop } from '@proc7ts/primitives';
import { UcdRx } from '../ucd-rx.js';

export const UCD_OPAQUE_RX = {
  _: {
    map: {
      for(_key: string): UcdRx {
        return UCD_OPAQUE_RX;
      },
      end: noop,
    },
    nls(): UcdRx {
      return UCD_OPAQUE_RX;
    },
    any(_value: unknown): 1 {
      return 1;
    },
  },
  lst(): 1 {
    return 1;
  },
} satisfies UcdRx;
