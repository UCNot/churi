import { noop } from '@proc7ts/primitives';

export interface UcdRx {
  _: UcdItemRx;

  lst?(this: void): 1;
  end?(this: void): void;
}

export interface UcdItemRx {
  bol?(this: void, value: boolean): 1;
  big?(this: void, value: bigint): 1;
  nls?(this: void): UcdRx | undefined;
  nul?(this: void): 1;
  num?(this: void, value: number): 1;
  str?(this: void, value: string): 1;

  for?(this: void, key: PropertyKey): UcdRx | undefined;
  map?(this: void): void;

  any?(this: void, value: bigint | boolean | number | string | symbol | object): 1 | 0 | undefined;
}

export interface UcdMapRx extends UcdItemRx {
  for(key: PropertyKey): UcdRx;
  map(): void;
}

export const UCD_OPAQUE_RX = {
  _: {
    for(_key: string): UcdRx {
      return UCD_OPAQUE_RX;
    },
    map: noop,
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
