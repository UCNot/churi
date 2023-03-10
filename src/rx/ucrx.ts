import { noop } from '@proc7ts/primitives';

export interface Ucrx {
  _: UcrxItem;

  em?(this: void): 1;
  ls?(this: void): void;
}

export interface UcrxItem {
  bol?(this: void, value: boolean): 1;
  big?(this: void, value: bigint): 1;
  nls?(this: void): Ucrx | undefined;
  nul?(this: void): 1;
  num?(this: void, value: number): 1;
  str?(this: void, value: string): 1;

  for?(this: void, key: PropertyKey): Ucrx | undefined;
  map?(this: void): void;

  any?(this: void, value: bigint | boolean | number | string | symbol | object): 1 | 0 | undefined;
}

export interface UcrxMap extends UcrxItem {
  for(key: PropertyKey): Ucrx;
  map(): void;
}

export const UCRX_OPAQUE = {
  _: {
    for(_key: string): Ucrx {
      return UCRX_OPAQUE;
    },
    map: noop,
    nls(): Ucrx {
      return UCRX_OPAQUE;
    },
    any(_value: unknown): 1 {
      return 1;
    },
  },
  em(): 1 {
    return 1;
  },
  ls: noop,
} satisfies Ucrx;
