import { noop } from '@proc7ts/primitives';

export interface Ucrx {
  bol?: ((this: void, value: boolean) => 1) | null;
  big?: ((this: void, value: bigint) => 1) | null;
  nls?: ((this: void) => Ucrx | undefined) | null;
  num?: ((this: void, value: number) => 1) | null;
  str?: ((this: void, value: string) => 1) | null;

  for?: ((this: void, key: PropertyKey) => Ucrx | undefined) | null;
  map?: ((this: void) => void) | null;

  em?: ((this: void) => 1) | null;
  ls?: ((this: void) => void) | null;

  any?: ((this: void, value: bigint | boolean | number | string | symbol | object) => 1) | null;
  nul?: ((this: void) => 1) | null;
}

export interface UcrxMap extends Ucrx {
  for(this: void, key: PropertyKey): Ucrx;
  map(this: void): void;
}

export interface UcrxList extends Ucrx {
  em(this: void): 1;
  ls(this: void): void;
}

// istanbul ignore next
export const UCRX_OPAQUE = {
  for(_key: PropertyKey): Ucrx {
    return UCRX_OPAQUE;
  },
  map: noop,
  nls(): Ucrx {
    return UCRX_OPAQUE;
  },
  em(): 1 {
    return 1;
  },
  ls: noop,
  any(_value: unknown): 1 {
    return 1;
  },
  nul(): 1 {
    return 1;
  },
} satisfies Ucrx;
