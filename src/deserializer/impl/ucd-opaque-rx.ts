import { UcdRx } from '../ucd-rx.js';

export const UCD_OPAQUE_RX: UcdRx = {
  _: {
    nls() {
      return UCD_OPAQUE_RX;
    },
    any(_value) {
      return 1;
    },
  },
  lst(): 1 {
    return 1;
  },
};
