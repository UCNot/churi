export interface UcdRx {
  _: UcdValueRx;

  lst?(): 1;
  end?(): void;
}

export interface UcdValueRx {
  bol?(value: boolean): 1;
  big?(value: bigint): 1;
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
