import { noop } from '@proc7ts/primitives';

export interface UcdRx {
  _: UcdValueRx;

  lst?(): 1;
  end?(): void;
}

export interface UcdValueRx {
  bol?(value: boolean): 1;
  big?(value: bigint): 1;
  nls?(): UcdRx | undefined;
  map?: UcdMapRx | undefined;
  nul?(): 1;
  num?(value: number): 1;
  str?(value: string): 1;
  any?(value: bigint | boolean | number | string | symbol | object): 1 | 0 | undefined;
}

export interface UcdMapRx {
  for(key: PropertyKey): UcdRx | undefined;
  end(): void;
}

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
  end: noop,
} satisfies UcdRx;
